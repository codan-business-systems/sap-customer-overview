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
			 * @param {string} sRegion Region/State
			 * @param {string} sPostcode Postcode
			 * @returns {string} Formatted address string
			 */
			address: function(sRegion, sPostcode) {
				var bCommaAdded = false;
				var sResult = "";
				
				if (sRegion && sRegion !== "") {
					sResult = bCommaAdded ? sResult + "  " + sRegion : sResult + ", " + sRegion;
				}
				
				if (sPostcode && sPostcode !== "") {
					sResult = bCommaAdded ? sResult + "  " + sPostcode : sResult + ", " + sPostcode;
				}
				
				return sResult;
			},
			
			/**
			 * Formats the Account Fact Sheet details object header
			 * @param {string} sId Account Id
			 * @public
			 */
			 factSheetHeader: function(sId) {
			 	return "Account Details (" + sId + ")";
			 }

		};

	}
);