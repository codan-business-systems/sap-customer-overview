sap.ui.define([
	] , function () {
		"use strict";

		return {

			/**
			 * Rounds the number unit value to 2 digits
			 * @public
			 * @param {string} sValue the number string to be rounded
			 * @returns {string} sValue with 2 digits rounded
			 */
			numberUnit : function (sValue) {
				if (!sValue) {
					return "";
				}
				return parseFloat(sValue).toFixed(2);
			},
			
			/**
			 * Formats parts of an address into a single string
			 * @public
			 * @param {string} sStreet Street Name
			 * @param {string} sCity   City/Town
			 * @param {string} sRegion Region/State
			 * @param {string} sPostcode Postcode
			 * @returns {string} Formatted address string
			 */
			address: function(sStreet, sCity, sRegion, sPostcode) {
				var sResult = sStreet;
				var bCommaAdded = false;
				
				if (sCity && sCity !== "") {
					sResult = sResult === "" ? sCity : sResult + ", " + sCity;
					bCommaAdded = true;
				}
				
				if (sRegion && sRegion !== "") {
					sResult = bCommaAdded ? sResult + "  " + sRegion : sResult + ", " + sRegion;
				}
				
				if (sPostcode && sPostcode !== "") {
					sResult = bCommaAdded ? sResult + "  " + sPostcode : sResult + ", " + sPostcode;
				}
				
				return sResult;
			},
			
			/**
			 * Formats an RMA Document Id depending on whether it has a description or not
			 * @param {string} sId Document Id
			 * @param {string} sDesc Description
			 * @returns {string} Formatted document identifier
			 */
			rmaDocumentId: function(sId, sDesc) {
				if (!sDesc) {
					return sId;
				} else {
					return sDesc + " (" + sId + ")";
				}
			},
			
			/**
			 * Format RMA status text based on the status
			 * @param {string} sStatus Status Code
			 * @return {sap.ui.core.ValueState} containing object header state
			 * @public
			 * 
			 */
			rmaStatus: function(sStatus) {
				var sResult = sap.ui.core.ValueState.None;
				
				switch (sStatus) {
					case "CANC" :
						sResult = sap.ui.core.ValueState.Error;
						break;
				    case "INIT" :
				    	sResult = sap.ui.core.ValueState.Error;
				    	break;
				    case "BOOK" :
				    	sResult = sap.ui.core.ValueState.Warning;
				    	break;
				    case "REPA" :
				    	sResult = sap.ui.core.ValueState.Warning;
				    	break;
				    case "VEND" :
				    	sResult = sap.ui.core.ValueState.Error;
				    	break;
				    case "APPR" :
				    	sResult = sap.ui.core.ValueState.Error;
				    	break;
				    case "SHIP" :
				    	sResult = sap.ui.core.ValueState.Warning;
				    	break;
				    case "COMP" :
				    	sResult = sap.ui.core.ValueState.Success;
				    	break;
				}
				return sResult; 
				
			}

		};

	}
);