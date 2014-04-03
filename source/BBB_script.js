// Some useful variable contening the DOM element
var pic = document.getElementById('bgPic');
var trTop = document.getElementById('trTop');
var trBottom = document.getElementById('trBottom');
var parent = document.getElementById('interactiveMapContainer');

/**********************************************************************/

// Definition of the offsets of "Where is the first pin from the left/top corner (0,0 coordinate) of the picture"
// Copy/Paste adapt to add yours

var P8Offset = {
	"xOffset" : 135, //for the x axis
	"yOffset" : 21, //for y axis
	"deltaX" : +14.5, //what is the derivation on the X axis between n and n-1 pin
	"deltaY" : -15.1, //what is the derivation on the Y axis between n and n-1 pin
	"direction" : "horizontal", //to know if the header is oriented horizontally or vertically
	"prefix" : "P8" //The name of this header (for the span IDs )
};

var P9Offset = {
	"xOffset" : 134,
	"yOffset" : 299,
	"deltaX" : +14.4,
	"deltaY" : -15.03,
	"direction" : "horizontal",
	"prefix" : "P9"
};

// Debug Serial Header
var DSHOffset = {
	"xOffset" : 262,
	"yOffset" : 266,
	"deltaX" : +14.4,
	"deltaY" : 0,
	"prefix" : "DSH"
};

// User LEDs
var USROffset = {
	"xOffset" : 39,
	"yOffset" : 28,
	"deltaX" : +0.0,
	"deltaY" : +11,
	"prefix" : "USR"
};

/**********************************************************************/

// startup function to populate the picture with span when the DOM is ready
(function(){
	pic.addEventListener('load', function() {
		addElements(P8);
		addElements(P9);
		addElements(DSH);
		addElements(USR);
		addCheckboxBehavior();
	});
})()

// This function add the checkbox behavior to slighty reveal the pins or not
function addCheckboxBehavior() {
	var el = document.getElementById('optionsReveal');
	var inputs = el.getElementsByTagName('input'); 
	for(var i=0; i<inputs.length; i++) {
		inputs[i].addEventListener('click', function() {
			console.log(this);
			var nom = this.id.substr(5);
			var elements = document.querySelectorAll('.' + nom);
			if(this.checked) {
				Array.prototype.forEach.call(elements, function(el, i) {
        			el.className += ' ' + 'opacity';
        		});
			} else {
  				Array.prototype.forEach.call(elements, function(el, i){
        			el.className = el.className.replace(new RegExp('(^|\\b)' + 'opacity'.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
        		});
			}
		});
	}
}

// This is the main function.
// It populate the DOM with plenty of empty span that you can hover
function addElements(liste) {
	var offset;

  	var picOffset = pic.getBoundingClientRect();

  	// choose the right offset definition depending on the header
  	switch(liste) {
  		case(P8) : offset = P8Offset; break;
  		case(P9) : offset = P9Offset; break;
  		case(DSH) : offset = DSHOffset; break;
  		case(USR) : offset = USROffset; break;
  		default : return; break;
  	}
  	offset.xOffset += picOffset.left; //add the horizontal picture offset
  	offset.yOffset += picOffset.top; //add the vertical picture offset

	// populate
	for(var x in liste) {
    	var newSpan = document.createElement('span');
    	var realX = parseInt(x)+1;
    	newSpan.setAttribute('id', offset.prefix + '_' + realX);
    	newSpan.classList.add("headerPin");

    	// class according to notes
		switch(liste[x].Notes) {
			case("hdmi"): newSpan.classList.add("hdmiPin");break;
			case("emmc2"): newSpan.classList.add("emmc2Pin");break;
			case("I2C2"): newSpan.classList.add("i2c2Pin");break;
			case("mcasp0"): newSpan.classList.add("mcasp0Pin");break;
			case("Serial Debug Header"): newSpan.classList.add("serialdebugPin");break;
			case("USR"): newSpan.classList.add("usrledPin");break;
			case(""): newSpan.classList.add("freePin");break;
			default: newSpan.classList.add("unknowPin");break;
		}
		if(liste[x].Notes.substr(0,5) === "Power") {
			newSpan.classList.remove("unknowPin");
			newSpan.classList.add("powerPin");
		}

    	// position of the span element, mathematics here I come
    	if(offset.deltaX > 0 && offset.deltaY === 0) { // one line disposal (DSH)
    		newSpan.style.left = (offset.xOffset + offset.deltaX*((realX-1))) + "px";
			newSpan.style.top = (offset.yOffset + offset.deltaY*realX) + "px";
    	} else if(offset.deltaX === 0 && offset.deltaY > 0) { // one column disposal (USR)
			newSpan.style.left = (offset.xOffset + offset.deltaX*((realX-1))) + "px";
			newSpan.style.top = (offset.yOffset + offset.deltaY*realX) + "px";
    	} else { //elements on two lines (like P8/9 headers)
    		if(offset.direction === "horizontal") {
		    	if(realX%2) {
					newSpan.style.left = (offset.xOffset + offset.deltaX*((realX-1)/2)) + "px";
					newSpan.style.top = (offset.yOffset) + "px";
		    	} else {
					newSpan.style.left = (offset.xOffset + offset.deltaX*((realX-2)/2)) + "px";
					newSpan.style.top = (offset.yOffset + offset.deltaY) + "px";
		    	}
	    	} else if(offset.direction === "vertical") { //not tested !!!
	    		if(realX%2) {
					newSpan.style.left = (offset.xOffset) + "px";
					newSpan.style.top = (offset.yOffset + offset.deltaY*((realX-1)/2)) + "px";
		    	} else {
					newSpan.style.left = (offset.xOffset + offset.deltaX) + "px";
					newSpan.style.top = (offset.yOffset + offset.deltaY*((realX-2)/2)) + "px";
		    	}
	    	}
	    }

    	// add the eventListener
    	newSpan.addEventListener('mouseover', hovering);

    	// and finally add the span to the div
    	parent.appendChild(newSpan);
    }
}


// This is the function triggered everytime the mouse enter a span.
// It refresh the table row (take the datas from the big array below)
function hovering(evt) {
	var el = evt.target ? evt.target : evt.toElement; // IE/Mozilla/Chrome hack
	var id = el.getAttribute('id');
	var P = id.substr(0,id.indexOf("_"));
	var idx = parseInt(id.substr(id.indexOf("_")+1))-1;
	var liste = null;

	// Decide what JSON array to use according to the id of the span
	switch(P) {
		case('P8') : liste = P8; break;
		case('P9') : liste = P9; break;
		case('DSH') : liste = DSH; break;
		case('USR') : liste = USR; break;
		default: return; break;
	}

	var data = liste[idx]; //the element to use from the JSON Array
	var content = "<tr>";
	content += '<td>' + ((data['Head_pin'] != "") ? data['Head_pin'] : ' - ') + '</td>';
	content += '<td>' + ((data['$PINS'] != "") ? data['$PINS'] : ' - ') + '</td>';
	content += '<td>' + ((data['ADDR/OFFSET'] != "") ? data['ADDR/OFFSET'] : ' - ') + '</td>';
	content += '<td>' + ((data['GPIO No.'] != "") ? data['GPIO No.'] : ' - ') + '</td>';
	content += '<td>' + ((data['Name'] != "") ? data['Name'] : ' - ') + '</td>';
	content += '<td>' + ((data['PIN'] != "") ? data['PIN'] : ' - ') + '</td>';
	content += '<td colspan="2">' + ((data['Notes'] != "") ? data['Notes'] : ' - ') + '</td>';
	content += '</tr>';
	trTop.innerHTML = content; //update the top row (functions)

	content = '<tr>';
	for(var i=7; i>=0; i--) {
		content += '<td>' + ((data['Mode'+i] != "") ? data['Mode'+i] : ' - ') + '</td>';
	}
	content += '</tr>';
	trBottom.innerHTML = content; //update the bottome row (modes)
}

/**********************************************************************/

// LONNNGGGGG definition of all the Pins...

var USR = [
{"Head_pin":"USR_0","$PINS":"21","ADDR/OFFSET":"0x854/054","GPIO No.":"53","Name":"GPIO1_21","Mode7":"","Mode6":"","Mode5":"","Mode4":"","Mode3":"","Mode2":"","Mode1":"","Mode0":"","PIN":"","Notes":"USR"},
{"Head_pin":"USR_1","$PINS":"22","ADDR/OFFSET":"0x858/058","GPIO No.":"86","Name":"GPIO1_22","Mode7":"","Mode6":"","Mode5":"","Mode4":"","Mode3":"","Mode2":"","Mode1":"","Mode0":"","PIN":"","Notes":"USR"},
{"Head_pin":"USR_2","$PINS":"23","ADDR/OFFSET":"0x85c/05c","GPIO No.":"87","Name":"GPIO1_23","Mode7":"","Mode6":"","Mode5":"","Mode4":"","Mode3":"","Mode2":"","Mode1":"","Mode0":"","PIN":"","Notes":"USR"},
{"Head_pin":"USR_3","$PINS":"24","ADDR/OFFSET":"0x860/060","GPIO No.":"88","Name":"GPIO1_24","Mode7":"","Mode6":"","Mode5":"","Mode4":"","Mode3":"","Mode2":"","Mode1":"","Mode0":"","PIN":"","Notes":"USR"},
];

var DSH = [
{"Head_pin":"DSH_01","$PINS":"","ADDR/OFFSET":"","GPIO No.":"","Name":"GND","Mode7":"","Mode6":"","Mode5":"","Mode4":"","Mode3":"","Mode2":"","Mode1":"","Mode0":"","PIN":"","Notes":"Power: Ground"},
{"Head_pin":"DSH_02","$PINS":"","ADDR/OFFSET":"","GPIO No.":"","Name":"NC","Mode7":"","Mode6":"","Mode5":"","Mode4":"","Mode3":"","Mode2":"","Mode1":"","Mode0":"","PIN":"","Notes":"Not Connected"},
{"Head_pin":"DSH_03","$PINS":"","ADDR/OFFSET":"","GPIO No.":"","Name":"NC","Mode7":"","Mode6":"","Mode5":"","Mode4":"","Mode3":"","Mode2":"","Mode1":"","Mode0":"","PIN":"","Notes":"Not Connected"},
{"Head_pin":"DSH_04","$PINS":"","ADDR/OFFSET":"","GPIO No.":"","Name":"TXD","Mode7":"","Mode6":"","Mode5":"","Mode4":"","Mode3":"","Mode2":"","Mode1":"","Mode0":"","PIN":"","Notes":"Serial Debug Header"},
{"Head_pin":"DSH_05","$PINS":"","ADDR/OFFSET":"","GPIO No.":"","Name":"RXD","Mode7":"","Mode6":"","Mode5":"","Mode4":"","Mode3":"","Mode2":"","Mode1":"","Mode0":"","PIN":"","Notes":"Serial Debug Header"},
{"Head_pin":"DSH_06","$PINS":"","ADDR/OFFSET":"","GPIO No.":"","Name":"NC","Mode7":"","Mode6":"","Mode5":"","Mode4":"","Mode3":"","Mode2":"","Mode1":"","Mode0":"","PIN":"","Notes":"Not Connected"},
];

var P8 = [
{"Head_pin":"P8_01","$PINS":"","ADDR/OFFSET":"","GPIO No.":"","Name":"GND","Mode7":"","Mode6":"","Mode5":"","Mode4":"","Mode3":"","Mode2":"","Mode1":"","Mode0":"","PIN":"","Notes":"Power: Ground"},
{"Head_pin":"P8_02","$PINS":"","ADDR/OFFSET":"","GPIO No.":"","Name":"GND","Mode7":"","Mode6":"","Mode5":"","Mode4":"","Mode3":"","Mode2":"","Mode1":"","Mode0":"","PIN":"","Notes":"Power: Ground"},
{"Head_pin":"P8_03","$PINS":6,"ADDR/OFFSET":"0x818/018","GPIO No.":38,"Name":"GPIO1_6","Mode7":"gpio1[6]","Mode6":"","Mode5":"","Mode4":"","Mode3":"","Mode2":"","Mode1":"mmc1_dat6","Mode0":"gpmc_ad6","PIN":"R9","Notes":"emmc2"},
{"Head_pin":"P8_04","$PINS":7,"ADDR/OFFSET":"0x81c/01c","GPIO No.":39,"Name":"GPIO1_7","Mode7":"gpio1[7]","Mode6":"","Mode5":"","Mode4":"","Mode3":"","Mode2":"","Mode1":"mmc1_dat7","Mode0":"gpmc_ad7","PIN":"T9","Notes":"emmc2"},
{"Head_pin":"P8_05","$PINS":2,"ADDR/OFFSET":"0x808/008","GPIO No.":34,"Name":"GPIO1_2","Mode7":"gpio1[2]","Mode6":"","Mode5":"","Mode4":"","Mode3":"","Mode2":"","Mode1":"mmc1_dat2","Mode0":"gpmc_ad2","PIN":"R8","Notes":"emmc2"},
{"Head_pin":"P8_06","$PINS":3,"ADDR/OFFSET":"0x80c/00c","GPIO No.":35,"Name":"GPIO1_3","Mode7":"gpio1[3]","Mode6":"","Mode5":"","Mode4":"","Mode3":"","Mode2":"","Mode1":"mmc1_dat3","Mode0":"gpmc_ad3","PIN":"T8","Notes":"emmc2"},
{"Head_pin":"P8_07","$PINS":36,"ADDR/OFFSET":"0x890/090","GPIO No.":66,"Name":"TIMER4","Mode7":"gpio2[2]","Mode6":"","Mode5":"","Mode4":"","Mode3":"","Mode2":"timer4","Mode1":"","Mode0":"gpmc_advn_ale","PIN":"R7","Notes":""},
{"Head_pin":"P8_08","$PINS":37,"ADDR/OFFSET":"0x894/094","GPIO No.":67,"Name":"TIMER7","Mode7":"gpio2[3]","Mode6":"","Mode5":"","Mode4":"","Mode3":"","Mode2":"timer7","Mode1":"","Mode0":"gpmc_oen_ren","PIN":"T7","Notes":""},
{"Head_pin":"P8_09","$PINS":39,"ADDR/OFFSET":"0x89c/09c","GPIO No.":69,"Name":"TIMER5","Mode7":"gpio2[5]","Mode6":"","Mode5":"","Mode4":"","Mode3":"","Mode2":"timer5","Mode1":"","Mode0":"gpmc_be0n_cle","PIN":"T6","Notes":""},
{"Head_pin":"P8_10","$PINS":38,"ADDR/OFFSET":"0x898/098","GPIO No.":68,"Name":"TIMER6","Mode7":"gpio2[4]","Mode6":"","Mode5":"","Mode4":"","Mode3":"","Mode2":"timer6","Mode1":"","Mode0":"gpmc_wen","PIN":"U6","Notes":""},
{"Head_pin":"P8_11","$PINS":13,"ADDR/OFFSET":"0x834/034","GPIO No.":45,"Name":"GPIO1_13","Mode7":"gpio1[13]","Mode6":"pr1_pru0_pru_r30_15","Mode5":"","Mode4":"eQEP2B_in","Mode3":"mmc2_dat1","Mode2":"mmc1_dat5","Mode1":"lcd_data18","Mode0":"gpmc_ad13","PIN":"R12","Notes":""},
{"Head_pin":"P8_12","$PINS":12,"ADDR/OFFSET":"0x830/030","GPIO No.":44,"Name":"GPIO1_12","Mode7":"gpio1[12]","Mode6":"pr1_pru0_pru_r30_14","Mode5":"","Mode4":"EQEP2A_IN","Mode3":"MMC2_DAT0","Mode2":"MMC1_DAT4","Mode1":"LCD_DATA19","Mode0":"GPMC_AD12","PIN":"T12","Notes":""},
{"Head_pin":"P8_13","$PINS":9,"ADDR/OFFSET":"0x824/024","GPIO No.":23,"Name":"EHRPWM2B","Mode7":"gpio0[23]","Mode6":"","Mode5":"","Mode4":"ehrpwm2B","Mode3":"mmc2_dat5","Mode2":"mmc1_dat1","Mode1":"lcd_data22","Mode0":"gpmc_ad9","PIN":"T10","Notes":""},
{"Head_pin":"P8_14","$PINS":10,"ADDR/OFFSET":"0x828/028","GPIO No.":26,"Name":"GPIO0_26","Mode7":"gpio0[26]","Mode6":"","Mode5":"","Mode4":"ehrpwm2_tripzone_in","Mode3":"mmc2_dat6","Mode2":"mmc1_dat2","Mode1":"lcd_data21","Mode0":"gpmc_ad10","PIN":"T11","Notes":""},
{"Head_pin":"P8_15","$PINS":15,"ADDR/OFFSET":"0x83c/03c","GPIO No.":47,"Name":"GPIO1_15","Mode7":"gpio1[15]","Mode6":"pr1_pru0_pru_r31_15","Mode5":"","Mode4":"eQEP2_strobe","Mode3":"mmc2_dat3","Mode2":"mmc1_dat7","Mode1":"lcd_data16","Mode0":"gpmc_ad15","PIN":"U13","Notes":""},
{"Head_pin":"P8_16","$PINS":14,"ADDR/OFFSET":"0x838/038","GPIO No.":46,"Name":"GPIO1_14","Mode7":"gpio1[14]","Mode6":"pr1_pru0_pru_r31_14","Mode5":"","Mode4":"eQEP2_index","Mode3":"mmc2_dat2","Mode2":"mmc1_dat6","Mode1":"lcd_data17","Mode0":"gpmc_ad14","PIN":"V13","Notes":""},
{"Head_pin":"P8_17","$PINS":11,"ADDR/OFFSET":"0x82c/02c","GPIO No.":27,"Name":"GPIO0_27","Mode7":"gpio0[27]","Mode6":"","Mode5":"","Mode4":"ehrpwm0_synco","Mode3":"mmc2_dat7","Mode2":"mmc1_dat3","Mode1":"lcd_data20","Mode0":"gpmc_ad11","PIN":"U12","Notes":""},
{"Head_pin":"P8_18","$PINS":35,"ADDR/OFFSET":"0x88c/08c","GPIO No.":65,"Name":"GPIO2_1","Mode7":"gpio2[1]","Mode6":"mcasp0_fsr","Mode5":"","Mode4":"","Mode3":"mmc2_clk","Mode2":"gpmc_wait1","Mode1":"lcd_memory_clk","Mode0":"gpmc_clk_mux0","PIN":"V12","Notes":""},
{"Head_pin":"P8_19","$PINS":8,"ADDR/OFFSET":"0x820/020","GPIO No.":22,"Name":"EHRPWM2A","Mode7":"gpio0[22]","Mode6":"","Mode5":"","Mode4":"ehrpwm2A","Mode3":"mmc2_dat4","Mode2":"mmc1_dat0","Mode1":"lcd_data23","Mode0":"gpmc_ad8","PIN":"U10","Notes":""},
{"Head_pin":"P8_20","$PINS":33,"ADDR/OFFSET":"0x884/084","GPIO No.":63,"Name":"GPIO1_31","Mode7":"gpio1[31]","Mode6":"pr1_pru1_pru_r31_13","Mode5":"pr1_pru1_pru_r30_13","Mode4":"","Mode3":"","Mode2":"mmc1_cmd","Mode1":"gpmc_be1n","Mode0":"gpmc_csn2","PIN":"V9","Notes":"emmc2"},
{"Head_pin":"P8_21","$PINS":32,"ADDR/OFFSET":"0x880/080","GPIO No.":62,"Name":"GPIO1_30","Mode7":"gpio1[30]","Mode6":"pr1_pru1_pru_r31_12","Mode5":"pr1_pru1_pru_r30_12","Mode4":"","Mode3":"","Mode2":"mmc1_clk","Mode1":"gpmc_clk","Mode0":"gpmc_csn1","PIN":"U9","Notes":"emmc2"},
{"Head_pin":"P8_22","$PINS":5,"ADDR/OFFSET":"0x814/014","GPIO No.":37,"Name":"GPIO1_5","Mode7":"gpio1[5]","Mode6":"","Mode5":"","Mode4":"","Mode3":"","Mode2":"","Mode1":"mmc1_dat5","Mode0":"gpmc_ad5","PIN":"V8","Notes":"emmc2"},
{"Head_pin":"P8_23","$PINS":4,"ADDR/OFFSET":"0x810/010","GPIO No.":36,"Name":"GPIO1_4","Mode7":"gpio1[4]","Mode6":"","Mode5":"","Mode4":"","Mode3":"","Mode2":"","Mode1":"mmc1_dat4","Mode0":"gpmc_ad4","PIN":"U8","Notes":"emmc2"},
{"Head_pin":"P8_24","$PINS":1,"ADDR/OFFSET":"0x804/004","GPIO No.":33,"Name":"GPIO1_1","Mode7":"gpio1[1]","Mode6":"","Mode5":"","Mode4":"","Mode3":"","Mode2":"","Mode1":"mmc1_dat1","Mode0":"gpmc_ad1","PIN":"V7","Notes":"emmc2"},
{"Head_pin":"P8_25","$PINS":0,"ADDR/OFFSET":"0x800/000","GPIO No.":32,"Name":"GPIO1_0","Mode7":"gpio1[0]","Mode6":"","Mode5":"","Mode4":"","Mode3":"","Mode2":"","Mode1":"mmc1_dat0","Mode0":"gpmc_ad0","PIN":"U7","Notes":"emmc2"},
{"Head_pin":"P8_26","$PINS":31,"ADDR/OFFSET":"0x87c/07c","GPIO No.":61,"Name":"GPIO1_29","Mode7":"gpio1[29]","Mode6":"","Mode5":"","Mode4":"","Mode3":"","Mode2":"","Mode1":"","Mode0":"gpmc_csn0","PIN":"V6","Notes":""},
{"Head_pin":"P8_27","$PINS":56,"ADDR/OFFSET":"0x8e0/0e0","GPIO No.":86,"Name":"GPIO2_22","Mode7":"gpio2[22]","Mode6":"pr1_pru1_pru_r31_8","Mode5":"pr1_pru1_pru_r30_8","Mode4":"","Mode3":"","Mode2":"","Mode1":"gpmc_a8","Mode0":"lcd_vsync","PIN":"U5","Notes":"hdmi"},
{"Head_pin":"P8_28","$PINS":58,"ADDR/OFFSET":"0x8e8/0e8","GPIO No.":88,"Name":"GPIO2_24","Mode7":"gpio2[24]","Mode6":"pr1_pru1_pru_r31_10","Mode5":"pr1_pru1_pru_r30_10","Mode4":"","Mode3":"","Mode2":"","Mode1":"gpmc_a10","Mode0":"lcd_pclk","PIN":"V5","Notes":"hdmi"},
{"Head_pin":"P8_29","$PINS":57,"ADDR/OFFSET":"0x8e4/0e4","GPIO No.":87,"Name":"GPIO2_23","Mode7":"gpio2[23]","Mode6":"pr1_pru1_pru_r31_9","Mode5":"pr1_pru1_pru_r30_9","Mode4":"","Mode3":"","Mode2":"","Mode1":"gpmc_a9","Mode0":"lcd_hsync","PIN":"R5","Notes":"hdmi"},
{"Head_pin":"P8_30","$PINS":59,"ADDR/OFFSET":"0x8ec/0ec","GPIO No.":89,"Name":"GPIO2_25","Mode7":"gpio2[25]","Mode6":"","Mode5":"","Mode4":"","Mode3":"","Mode2":"","Mode1":"gpmc_a11","Mode0":"lcd_ac_bias_en","PIN":"R6","Notes":"hdmi"},
{"Head_pin":"P8_31","$PINS":54,"ADDR/OFFSET":"0x8d8/0d8","GPIO No.":10,"Name":"UART5_CTSN","Mode7":"gpio0[10]","Mode6":"uart5_ctsn","Mode5":"","Mode4":"uart5_rxd","Mode3":"mcasp0_axr1","Mode2":"eQEP1_index","Mode1":"gpmc_a18","Mode0":"lcd_data14","PIN":"V4","Notes":"hdmi"},
{"Head_pin":"P8_32","$PINS":55,"ADDR/OFFSET":"0x8dc/0dc","GPIO No.":11,"Name":"UART5_RTSN","Mode7":"gpio0[11]","Mode6":"uart5_rtsn","Mode5":"","Mode4":"mcasp0_axr3","Mode3":"mcasp0_ahclkx","Mode2":"eQEP1_strobe","Mode1":"gpmc_a19","Mode0":"lcd_data15","PIN":"T5","Notes":"hdmi"},
{"Head_pin":"P8_33","$PINS":53,"ADDR/OFFSET":"0x8d4/0d4","GPIO No.":9,"Name":"UART4_RTSN","Mode7":"gpio0[9]","Mode6":"uart4_rtsn","Mode5":"","Mode4":"mcasp0_axr3","Mode3":"mcasp0_fsr","Mode2":"eQEP1B_in","Mode1":"gpmc_a17","Mode0":"lcd_data13","PIN":"V3","Notes":"hdmi"},
{"Head_pin":"P8_34","$PINS":51,"ADDR/OFFSET":"0x8cc/0cc","GPIO No.":81,"Name":"UART3_RTSN","Mode7":"gpio2[17]","Mode6":"uart3_rtsn","Mode5":"","Mode4":"mcasp0_axr2","Mode3":"mcasp0_ahclkr","Mode2":"ehrpwm1B","Mode1":"gpmc_a15","Mode0":"lcd_data11","PIN":"U4","Notes":"hdmi"},
{"Head_pin":"P8_35","$PINS":52,"ADDR/OFFSET":"0x8d0/0d0","GPIO No.":8,"Name":"UART4_CTSN","Mode7":"gpio0[8]","Mode6":"uart4_ctsn","Mode5":"","Mode4":"mcasp0_axr2","Mode3":"mcasp0_aclkr","Mode2":"eQEP1A_in","Mode1":"gpmc_a16","Mode0":"lcd_data12","PIN":"V2","Notes":"hdmi"},
{"Head_pin":"P8_36","$PINS":50,"ADDR/OFFSET":"0x8c8/0c8","GPIO No.":80,"Name":"UART3_CTSN","Mode7":"gpio2[16]","Mode6":"uart3_ctsn","Mode5":"","Mode4":"","Mode3":"mcasp0_axr0","Mode2":"ehrpwm1A","Mode1":"gpmc_a14","Mode0":"lcd_data10","PIN":"U3","Notes":"hdmi"},
{"Head_pin":"P8_37","$PINS":48,"ADDR/OFFSET":"0x8c0/0c0","GPIO No.":78,"Name":"UART5_TXD","Mode7":"gpio2[14]","Mode6":"uart2_ctsn","Mode5":"","Mode4":"uart5_txd","Mode3":"mcasp0_aclkx","Mode2":"ehrpwm1_tripzone_in","Mode1":"gpmc_a12","Mode0":"lcd_data8","PIN":"U1","Notes":"hdmi"},
{"Head_pin":"P8_38","$PINS":49,"ADDR/OFFSET":"0x8c4/0c4","GPIO No.":79,"Name":"UART5_RXD","Mode7":"gpio2[15]","Mode6":"uart2_rtsn","Mode5":"","Mode4":"uart5_rxd","Mode3":"mcasp0_fsx","Mode2":"ehrpwm0_synco","Mode1":"gpmc_a13","Mode0":"lcd_data9","PIN":"U2","Notes":"hdmi"},
{"Head_pin":"P8_39","$PINS":46,"ADDR/OFFSET":"0x8b8/0b8","GPIO No.":76,"Name":"GPIO2_12","Mode7":"gpio2[12]","Mode6":"pr1_pru1_pru_r31_6","Mode5":"pr1_pru1_pru_r30_6","Mode4":"","Mode3":"eQEP2_index","Mode2":"","Mode1":"gpmc_a6","Mode0":"lcd_data6","PIN":"T3","Notes":"hdmi"},
{"Head_pin":"P8_40","$PINS":47,"ADDR/OFFSET":"0x8bc/0bc","GPIO No.":77,"Name":"GPIO2_13","Mode7":"gpio2[13]","Mode6":"pr1_pru1_pru_r31_7","Mode5":"pr1_pru1_pru_r30_7","Mode4":"pr1_edio_data_out7","Mode3":"eQEP2_strobe","Mode2":"","Mode1":"gpmc_a7","Mode0":"lcd_data7","PIN":"T4","Notes":"hdmi"},
{"Head_pin":"P8_41","$PINS":44,"ADDR/OFFSET":"0x8b0/0b0","GPIO No.":74,"Name":"GPIO2_10","Mode7":"gpio2[10]","Mode6":"pr1_pru1_pru_r31_4","Mode5":"pr1_pru1_pru_r30_4","Mode4":"","Mode3":"eQEP2A_in","Mode2":"","Mode1":"gpmc_a4","Mode0":"lcd_data4","PIN":"T1","Notes":"hdmi"},
{"Head_pin":"P8_42","$PINS":45,"ADDR/OFFSET":"0x8b4/0b4","GPIO No.":75,"Name":"GPIO2_11","Mode7":"gpio2[11]","Mode6":"pr1_pru1_pru_r31_5","Mode5":"pr1_pru1_pru_r30_5","Mode4":"","Mode3":"eQEP2B_in","Mode2":"","Mode1":"gpmc_a5","Mode0":"lcd_data5","PIN":"T2","Notes":"hdmi"},
{"Head_pin":"P8_43","$PINS":42,"ADDR/OFFSET":"0x8a8/0a8","GPIO No.":72,"Name":"GPIO2_8","Mode7":"gpio2[8]","Mode6":"pr1_pru1_pru_r31_2","Mode5":"pr1_pru1_pru_r30_2","Mode4":"","Mode3":"ehrpwm2_tripzone_in","Mode2":"","Mode1":"gpmc_a2","Mode0":"lcd_data2","PIN":"R3","Notes":"hdmi"},
{"Head_pin":"P8_44","$PINS":43,"ADDR/OFFSET":"0x8ac/0ac","GPIO No.":73,"Name":"GPIO2_9","Mode7":"gpio2[9]","Mode6":"pr1_pru1_pru_r31_3","Mode5":"pr1_pru1_pru_r30_3","Mode4":"","Mode3":"ehrpwm0_synco","Mode2":"","Mode1":"gpmc_a3","Mode0":"lcd_data3","PIN":"R4","Notes":"hdmi"},
{"Head_pin":"P8_45","$PINS":40,"ADDR/OFFSET":"0x8a0/0a0","GPIO No.":70,"Name":"GPIO2_6","Mode7":"gpio2[6]","Mode6":"pr1_pru1_pru_r31_0","Mode5":"pr1_pru1_pru_r30_0","Mode4":"","Mode3":"ehrpwm2A","Mode2":"","Mode1":"gpmc_a0","Mode0":"lcd_data0","PIN":"R1","Notes":"hdmi"},
{"Head_pin":"P8_46","$PINS":41,"ADDR/OFFSET":"0x8a4/0a4","GPIO No.":71,"Name":"GPIO2_7","Mode7":"gpio2[7]","Mode6":"pr1_pru1_pru_r31_1","Mode5":"pr1_pru1_pru_r30_1","Mode4":"","Mode3":"ehrpwm2B","Mode2":"","Mode1":"gpmc_a1","Mode0":"lcd_data1","PIN":"R2","Notes":"hdmi"}];

var P9 = [
{"Head_pin":"P9_01","$PINS":"","ADDR/OFFSET":"","Name":"GND","GPIO No":"","Mode7":"","Mode6":"","Mode5":"","Mode4":"","Mode3":"","Mode2":"","Mode1":"","Mode0":"","PIN":"","Notes":"Power: Ground"},
{"Head_pin":"P9_02","$PINS":"","ADDR/OFFSET":"","Name":"GND","GPIO No":"","Mode7":"","Mode6":"","Mode5":"","Mode4":"","Mode3":"","Mode2":"","Mode1":"","Mode0":"","PIN":"","Notes":"Power: Ground"},
{"Head_pin":"P9_03","$PINS":"","ADDR/OFFSET":"","Name":"DC_3.3V","GPIO No":"","Mode7":"","Mode6":"","Mode5":"","Mode4":"","Mode3":"","Mode2":"","Mode1":"","Mode0":"","PIN":"","Notes":"Power: DC 3.3V"},
{"Head_pin":"P9_04","$PINS":"","ADDR/OFFSET":"","Name":"DC_3.3V","GPIO No":"","Mode7":"","Mode6":"","Mode5":"","Mode4":"","Mode3":"","Mode2":"","Mode1":"","Mode0":"","PIN":"","Notes":"Power: DC 3.3V"},
{"Head_pin":"P9_05","$PINS":"","ADDR/OFFSET":"","Name":"VDD_5V","GPIO No":"","Mode7":"","Mode6":"","Mode5":"","Mode4":"","Mode3":"","Mode2":"","Mode1":"","Mode0":"","PIN":"","Notes":"Power: DC VDD_5V"},
{"Head_pin":"P9_06","$PINS":"","ADDR/OFFSET":"","Name":"VDD_5V","GPIO No":"","Mode7":"","Mode6":"","Mode5":"","Mode4":"","Mode3":"","Mode2":"","Mode1":"","Mode0":"","PIN":"","Notes":"Power: DC VDD_5V"},
{"Head_pin":"P9_07","$PINS":"","ADDR/OFFSET":"","Name":"SYS_5V","GPIO No":"","Mode7":"","Mode6":"","Mode5":"","Mode4":"","Mode3":"","Mode2":"","Mode1":"","Mode0":"","PIN":"","Notes":"Power: DC PWR_BUT"},
{"Head_pin":"P9_08","$PINS":"","ADDR/OFFSET":"","Name":"SYS_5V","GPIO No":"","Mode7":"","Mode6":"","Mode5":"","Mode4":"","Mode3":"","Mode2":"","Mode1":"","Mode0":"","PIN":"","Notes":"Power: DC SYS_5V"},
{"Head_pin":"P9_09","$PINS":"","ADDR/OFFSET":"","Name":"PWR_BUT","GPIO No":"","Mode7":"","Mode6":"","Mode5":"","Mode4":"","Mode3":"","Mode2":"","Mode1":"","Mode0":"","PIN":"","Notes":"Power: DC SYS_5V"},
{"Head_pin":"P9_10","$PINS":"","ADDR/OFFSET":"","Name":"SYS_RESETn","GPIO No":"","Mode7":"","Mode6":"","Mode5":"","Mode4":"","Mode3":"","Mode2":"","Mode1":"","Mode0":"","PIN":"SYS_RES","Notes":"SYS_RES"},
{"Head_pin":"P9_11","$PINS":28,"ADDR/OFFSET":"0x870/070","Name":"UART4_RXD","GPIO No":30,"Mode7":"gpio0[30]","Mode6":"uart4_rxd_mux2","Mode5":"","Mode4":"mmc1_sdcd","Mode3":"rmii2_crs_dv","Mode2":"gpmc_csn4","Mode1":"mii2_crs","Mode0":"gpmc_wait0","PIN":"T17","Notes":""},
{"Head_pin":"P9_12","$PINS":30,"ADDR/OFFSET":"0x878/078","Name":"GPIO1_28","GPIO No":60,"Mode7":"gpio1[28]","Mode6":"mcasp0_aclkr_mux3","Mode5":"","Mode4":"gpmc_dir","Mode3":"mmc2_dat3","Mode2":"gpmc_csn6","Mode1":"mii2_col","Mode0":"gpmc_be1n","PIN":"U18","Notes":""},
{"Head_pin":"P9_13","$PINS":29,"ADDR/OFFSET":"0x874/074","Name":"UART4_TXD","GPIO No":31,"Mode7":"gpio0[31]","Mode6":"uart4_txd_mux2","Mode5":"","Mode4":"mmc2_sdcd","Mode3":"rmii2_rxerr","Mode2":"gpmc_csn5","Mode1":"mii2_rxerr","Mode0":"gpmc_wpn","PIN":"U17","Notes":""},
{"Head_pin":"P9_14","$PINS":18,"ADDR/OFFSET":"0x848/048","Name":"EHRPWM1A","GPIO No":50,"Mode7":"gpio1[18]","Mode6":"ehrpwm1A_mux1","Mode5":"","Mode4":"gpmc_a18","Mode3":"mmc2_dat1","Mode2":"rgmii2_td3","Mode1":"mii2_txd3","Mode0":"gpmc_a2","PIN":"U14","Notes":""},
{"Head_pin":"P9_15","$PINS":16,"ADDR/OFFSET":"0x840/040","Name":"GPIO1_16","GPIO No":48,"Mode7":"gpio1[16]","Mode6":"ehrpwm1_tripzone_input","Mode5":"","Mode4":"gpmc_a16","Mode3":"mii2_txen","Mode2":"rmii2_tctl","Mode1":"gmii2_txen","Mode0":"gpmc_a0","PIN":"R13","Notes":""},
{"Head_pin":"P9_16","$PINS":19,"ADDR/OFFSET":"0x84c/04c","Name":"EHRPWM1B","GPIO No":51,"Mode7":"gpio1[19]","Mode6":"ehrpwm1B_mux1","Mode5":"","Mode4":"gpmc_a19","Mode3":"mmc2_dat2","Mode2":"rgmii2_td2","Mode1":"mii2_txd2","Mode0":"gpmc_a3","PIN":"T14","Notes":""},
{"Head_pin":"P9_17","$PINS":87,"ADDR/OFFSET":"0x95c/15c","Name":"I2C1_SCL","GPIO No":5,"Mode7":"gpio0[5]","Mode6":"","Mode5":"","Mode4":"pr1_uart0_txd","Mode3":"ehrpwm0_synci","Mode2":"I2C1_SCL","Mode1":"mmc2_sdwp","Mode0":"spi0_cs0","PIN":"A16","Notes":""},
{"Head_pin":"P9_18","$PINS":86,"ADDR/OFFSET":"0x958/158","Name":"I2C1_SDA","GPIO No":4,"Mode7":"gpio0[4]","Mode6":"","Mode5":"","Mode4":"pr1_uart0_rxd","Mode3":"ehrpwm0_tripzone","Mode2":"I2C1_SDA","Mode1":"mmc1_sdwp","Mode0":"spi0_d1","PIN":"B16","Notes":""},
{"Head_pin":"P9_19","$PINS":95,"ADDR/OFFSET":"0x97c/17c","Name":"I2C2_SCL","GPIO No":13,"Mode7":"gpio0[13]","Mode6":"","Mode5":"pr1_uart0_rts_n","Mode4":"spi1_cs1","Mode3":"I2C2_SCL","Mode2":"dcan0_rx","Mode1":"timer5","Mode0":"uart1_rtsn","PIN":"D17","Notes":"I2C2"},
{"Head_pin":"P9_20","$PINS":94,"ADDR/OFFSET":"0x978/178","Name":"I2C2_SDA","GPIO No":12,"Mode7":"gpio0[12]","Mode6":"","Mode5":"pr1_uart0_cts_n","Mode4":"spi1_cs0","Mode3":"I2C2_SDA","Mode2":"dcan0_tx","Mode1":"timer6","Mode0":"uart1_ctsn","PIN":"D18","Notes":"I2C2"},
{"Head_pin":"P9_21","$PINS":85,"ADDR/OFFSET":"0x954/154","Name":"UART2_TXD","GPIO No":3,"Mode7":"gpio0[3]","Mode6":"EMU3_mux1","Mode5":"","Mode4":"pr1_uart0_rts_n","Mode3":"ehrpwm0B","Mode2":"I2C2_SCL","Mode1":"uart2_txd","Mode0":"spi0_d0","PIN":"B17","Notes":""},
{"Head_pin":"P9_22","$PINS":84,"ADDR/OFFSET":"0x950/150","Name":"UART2_RXD","GPIO No":2,"Mode7":"gpio0[2]","Mode6":"EMU2_mux1","Mode5":"","Mode4":"pr1_uart0_cts_n","Mode3":"ehrpwm0A","Mode2":"I2C2_SDA","Mode1":"uart2_rxd","Mode0":"spi0_sclk","PIN":"A17","Notes":""},
{"Head_pin":"P9_23","$PINS":17,"ADDR/OFFSET":"0x844/044","Name":"GPIO1_17","GPIO No":49,"Mode7":"gpio1[17]","Mode6":"ehrpwm0_synco","Mode5":"","Mode4":"gpmc_a17","Mode3":"mmc2_dat0","Mode2":"rgmii2_rxdv","Mode1":"gmii2_rxdv","Mode0":"gpmc_a1","PIN":"V14","Notes":""},
{"Head_pin":"P9_24","$PINS":97,"ADDR/OFFSET":"0x984/184","Name":"UART1_TXD","GPIO No":15,"Mode7":"gpio0[15]","Mode6":"pr1_pru0_pru_r31_16","Mode5":"pr1_uart0_txd","Mode4":"","Mode3":"I2C1_SCL","Mode2":"dcan1_rx","Mode1":"mmc2_sdwp","Mode0":"uart1_txd","PIN":"D15","Notes":""},
{"Head_pin":"P9_25","$PINS":107,"ADDR/OFFSET":"0x9ac/1ac","Name":"GPIO3_21","GPIO No":117,"Mode7":"gpio3[21]","Mode6":"pr1_pru0_pru_r31_7","Mode5":"pr1_pru0_pru_r30_7","Mode4":"EMU4_mux2","Mode3":"mcasp1_axr1","Mode2":"mcasp0_axr3","Mode1":"eQEP0_strobe","Mode0":"mcasp0_ahclkx","PIN":"A14","Notes":"mcasp0"},
{"Head_pin":"P9_26","$PINS":96,"ADDR/OFFSET":"0x980/180","Name":"UART1_RXD","GPIO No":14,"Mode7":"gpio0[14]","Mode6":"pr1_pru1_pru_r31_16","Mode5":"pr1_uart0_rxd","Mode4":"","Mode3":"I2C1_SDA","Mode2":"dcan1_tx","Mode1":"mmc1_sdwp","Mode0":"uart1_rxd","PIN":"D16","Notes":""},
{"Head_pin":"P9_27","$PINS":105,"ADDR/OFFSET":"0x9a4/1a4","Name":"GPIO3_19","GPIO No":115,"Mode7":"gpio3[19]","Mode6":"pr1_pru0_pru_r31_5","Mode5":"pr1_pru0_pru_r30_5","Mode4":"EMU2_mux2","Mode3":"mcasp1_fsx","Mode2":"mcasp0_axr3","Mode1":"eQEP0B_in","Mode0":"mcasp0_fsr","PIN":"C13","Notes":""},
{"Head_pin":"P9_28","$PINS":103,"ADDR/OFFSET":"0x99c/19c","Name":"SPI1_CS0","GPIO No":113,"Mode7":"gpio3[17]","Mode6":"pr1_pru0_pru_r31_3","Mode5":"pr1_pru0_pru_r30_3","Mode4":"eCAP2_in_PWM2_out","Mode3":"spi1_cs0","Mode2":"mcasp0_axr2","Mode1":"ehrpwm0_synci","Mode0":"mcasp0_ahclkr","PIN":"C12","Notes":"mcasp0"},
{"Head_pin":"P9_29","$PINS":101,"ADDR/OFFSET":"0x994/194","Name":"SPI1_D0","GPIO No":111,"Mode7":"gpio3[15]","Mode6":"pr1_pru0_pru_r31_1","Mode5":"pr1_pru0_pru_r30_1","Mode4":"mmc1_sdcd_mux1","Mode3":"spi1_d0","Mode2":"","Mode1":"ehrpwm0B","Mode0":"mcasp0_fsx","PIN":"B13","Notes":"mcasp0"},
{"Head_pin":"P9_30","$PINS":102,"ADDR/OFFSET":"0x998/198","Name":"SPI1_D1","GPIO No":112,"Mode7":"gpio3[16]","Mode6":"pr1_pru0_pru_r31_2","Mode5":"pr1_pru0_pru_r30_2","Mode4":"mmc2_sdcd_mux1","Mode3":"spi1_d1","Mode2":"","Mode1":"ehrpwm0_tripzone","Mode0":"mcasp0_axr0","PIN":"D12","Notes":"mcasp0 ?"},
{"Head_pin":"P9_31","$PINS":100,"ADDR/OFFSET":"0x990/190","Name":"SPI1_SCLK","GPIO No":110,"Mode7":"gpio3[14]","Mode6":"pr1_pru0_pru_r31_0","Mode5":"pr1_pru0_pru_r30_0","Mode4":"mmc0_sdcd_mux1","Mode3":"spi1_sclk","Mode2":"","Mode1":"ehrpwm0A","Mode0":"mcasp0_aclkx","PIN":"A13","Notes":"mcasp0"},
{"Head_pin":"P9_32","$PINS":"","ADDR/OFFSET":"","Name":"VADC","GPIO No":"","Mode7":"","Mode6":"","Mode5":"","Mode4":"","Mode3":"","Mode2":"","Mode1":"","Mode0":"","PIN":"","Notes":"Power: ADC Ref. 1.8V"},
{"Head_pin":"P9_33","$PINS":"","ADDR/OFFSET":"","Name":"AIN4","GPIO No":"","Mode7":"","Mode6":"","Mode5":"","Mode4":"","Mode3":"","Mode2":"","Mode1":"","Mode0":"","PIN":"C8","Notes":""},
{"Head_pin":"P9_34","$PINS":"","ADDR/OFFSET":"","Name":"AGND","GPIO No":"","Mode7":"","Mode6":"","Mode5":"","Mode4":"","Mode3":"","Mode2":"","Mode1":"","Mode0":"","PIN":"","Notes":"Power: Ground"},
{"Head_pin":"P9_35","$PINS":"","ADDR/OFFSET":"","Name":"AIN6","GPIO No":"","Mode7":"","Mode6":"","Mode5":"","Mode4":"","Mode3":"","Mode2":"","Mode1":"","Mode0":"","PIN":"A8","Notes":""},
{"Head_pin":"P9_36","$PINS":"","ADDR/OFFSET":"","Name":"AIN5","GPIO No":"","Mode7":"","Mode6":"","Mode5":"","Mode4":"","Mode3":"","Mode2":"","Mode1":"","Mode0":"","PIN":"B8","Notes":""},
{"Head_pin":"P9_37","$PINS":"","ADDR/OFFSET":"","Name":"AIN2","GPIO No":"","Mode7":"","Mode6":"","Mode5":"","Mode4":"","Mode3":"","Mode2":"","Mode1":"","Mode0":"","PIN":"B7","Notes":""},
{"Head_pin":"P9_38","$PINS":"","ADDR/OFFSET":"","Name":"AIN3","GPIO No":"","Mode7":"","Mode6":"","Mode5":"","Mode4":"","Mode3":"","Mode2":"","Mode1":"","Mode0":"","PIN":"A7","Notes":""},
{"Head_pin":"P9_39","$PINS":"","ADDR/OFFSET":"","Name":"AIN0","GPIO No":"","Mode7":"","Mode6":"","Mode5":"","Mode4":"","Mode3":"","Mode2":"","Mode1":"","Mode0":"","PIN":"B6","Notes":""},
{"Head_pin":"P9_40","$PINS":"","ADDR/OFFSET":"","Name":"AIN1","GPIO No":"","Mode7":"","Mode6":"","Mode5":"","Mode4":"","Mode3":"","Mode2":"","Mode1":"","Mode0":"","PIN":"C7","Notes":""},
{"Head_pin":"P9_41A","$PINS":109,"ADDR/OFFSET":"0x9b4/1b4","Name":"CLKOUT2","GPIO No":20,"Mode7":"gpio0[20]","Mode6":"EMU3_mux0","Mode5":"pr1_pru0_pru_r31_16","Mode4":"timer7_mux1","Mode3":"clkout2","Mode2":"tclkin","Mode1":"","Mode0":"xdma_event_intr1","PIN":"D14","Notes":""},
//{"Head_pin":"P9_41B","$PINS":null,"ADDR/OFFSET":"0x9a8/1a8","Name":"GPIO3_20","GPIO No":116,"Mode7":"gpio3[20]","Mode6":"pr1_pru0_pru_r31_6","Mode5":"pr1_pru0_pru_r30_6","Mode4":"emu3","Mode3":"Mcasp1_axr0","Mode2":"","Mode1":"eQEP0_index","Mode0":"mcasp0_axr1","PIN":"D13","Notes":""},
{"Head_pin":"P9_42A","$PINS":89,"ADDR/OFFSET":"0x964/164","Name":"GPIO0_7","GPIO No":7,"Mode7":"gpio0[7]","Mode6":"xdma_event_intr2","Mode5":"mmc0_sdwp","Mode4":"spi1_sclk","Mode3":"pr1_ecap0_ecap_capin_apwm_o","Mode2":"spi1_cs1","Mode1":"uart3_txd","Mode0":"eCAP0_in_PWM0_out","PIN":"C18","Notes":"mcasp0"},
//{"Head_pin":"P9_42B","$PINS":null,"ADDR/OFFSET":"0x9a0/1a0","Name":"GPIO3_18","GPIO No":114,"Mode7":"gpio3[18]","Mode6":"pr1_pru0_pru_r31_4","Mode5":"pr1_pru0_pru_r30_4","Mode4":"","Mode3":"Mcasp1_aclkx","Mode2":"Mcaspo_axr2","Mode1":"eQEP0A_in","Mode0":"Mcasp0_aclkr","PIN":"B12","Notes":""},
{"Head_pin":"P9_43","$PINS":"","ADDR/OFFSET":"","Name":"GND","GPIO No":"","Mode7":"","Mode6":"","Mode5":"","Mode4":"","Mode3":"","Mode2":"","Mode1":"","Mode0":"","PIN":"","Notes":""},
{"Head_pin":"P9_44","$PINS":"","ADDR/OFFSET":"","Name":"GND","GPIO No":"","Mode7":"","Mode6":"","Mode5":"","Mode4":"","Mode3":"","Mode2":"","Mode1":"","Mode0":"","PIN":"","Notes":""},
{"Head_pin":"P9_45","$PINS":"","ADDR/OFFSET":"","Name":"GND","GPIO No":"","Mode7":"","Mode6":"","Mode5":"","Mode4":"","Mode3":"","Mode2":"","Mode1":"","Mode0":"","PIN":"","Notes":""},
{"Head_pin":"P9_46","$PINS":"","ADDR/OFFSET":"","Name":"GND","GPIO No":"","Mode7":"","Mode6":"","Mode5":"","Mode4":"","Mode3":"","Mode2":"","Mode1":"","Mode0":"","PIN":"","Notes":""}];

