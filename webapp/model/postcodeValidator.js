sap.ui.define([
], function() {
	"use strict";

	return {
		
		validatePostcode: function(countryModel, countryKey, postcode) {
			
			// Find the country parameters in the model via the country key
			var context = this._getContext(countryKey, countryModel.getData());

			
			/* Can't use below (thanks IE)
			var context = countryModel.getData().find(function(oEntry) 
				{ return oEntry.key === countryKey; }
			);
			*/

			return this.validateSAPPostcode(postcode, countryKey, context.postcodeMax, context.postcodeRule);
		},
		
		_getContext: function(countryKey, aCountries) {
			
			var result = "";
			
			for (var i = 0; i < aCountries.length; i++) {
				if (aCountries[i].key === countryKey) {
					result = aCountries[i];
					return result;
				}
			}
			
		},

		//validate a postcode according to SAP postcode rules
		validateSAPPostcode: function(postcode, country, postcodeMax, postcodeRule) {

			var postcodeValid = true;

			switch (postcodeRule) {

				case 0:
					break;

					//Maximum value length, no gaps
				case 1:
					//remove blank spaces
					postcode = postcode.replace(/ /g, '');

					//make sure postcode doesn't exceed maximum
					if (postcode.length > postcodeMax) {
						postcodeValid = false;
					}

					//USA specific rule 'NNNNN' or 'NNNNN-NNNN'
					if (country === 'US') {

						//remove dashes
						postcode = postcode.replace(/-/g, '');

						if (postcode.length === 5) {
							if (!postcode[0].match(/^\d$/) || //number
								!postcode[1].match(/^\d$/) || //number
								!postcode[2].match(/^\d$/) || //number
								!postcode[3].match(/^\d$/) || //number
								!postcode[4].match(/^\d$/)) //number
							{
								postcodeValid = false;
							}
						} else if (postcode.length === 9) {
							if (!postcode[0].match(/^\d$/) || //number
								!postcode[1].match(/^\d$/) || //number
								!postcode[2].match(/^\d$/) || //number
								!postcode[3].match(/^\d$/) || //number
								!postcode[4].match(/^\d$/) || //number
								!postcode[5].match(/^\d$/) || //number
								!postcode[6].match(/^\d$/) || //number
								!postcode[7].match(/^\d$/) || //number
								!postcode[8].match(/^\d$/)) //number
							{
								postcodeValid = false;
							}
						} else {
							postcodeValid = false;
						}
					}

					break;

					//Maximum value length, numerical, without gaps
				case 2:
					//remove blank spaces
					postcode = postcode.replace(/ /g, '');

					//make sure postcode doesn't exceed maximum and doesnt contain alpha characters
					if (postcode.length > postcodeMax || postcode.match(/[a-z]/i)) {
						postcodeValid = false;
					}
					break;

					//Length to be kept to exactly, without gaps
				case 3:
					//remove blank spaces
					postcode = postcode.replace(/ /g, '');

					//make sure postcode is exactly the correct length
					if (postcode.length !== postcodeMax) {
						postcodeValid = false;
					}
					break;

					//Length to be kept to exactly, numerical, without gaps
				case 4:
					//remove blank spaces
					postcode = postcode.replace(/ /g, '');

					//make sure postcode is exactly the correct length
					if (postcode.length !== postcodeMax || postcode.match(/[a-z]/i)) {
						postcodeValid = false;
					}
					break;

					//Maximum value length
				case 5:
					//make sure postcode less than maximum
					if (postcode.length > postcodeMax) {
						postcodeValid = false;
					}
					break;

					//Maximum value length, numerical
				case 6:
					//make sure postcode less than maximum
					if (postcode.length > postcodeMax || postcode.match(/[a-z]/i)) {
						postcodeValid = false;
					}
					break;

					//Length to be kept to exactly
				case 7:
					//make sure postcode is exactly the correct length
					if (postcode.length !== postcodeMax || postcode.match(/[a-z]/i)) {
						postcodeValid = false;
					}
					break;

					//Length to be kept to exactly, numerical
				case 8:
					//make sure postcode is exactly the correct length
					if (postcode.length !== postcodeMax || postcode.match(/[a-z]/i)) {
						postcodeValid = false;
					}
					break;

					//specific validate check (to be completed)
				case 9:

					//remove blank spaces
					postcode = postcode.replace(/ /g, '');

					//remove dashes
					postcode = postcode.replace(/-/g, '');

					//canada specific rule 'ANA NAN' (could be one regex if I was any good at writing regexes - which im not)
					if (country === 'CA') {
						if (postcode.length != postcodeMax ||
							!postcode[0].match(/[a-z]/i) || //alpha
							!postcode[1].match(/^\d$/) || //number
							!postcode[2].match(/[a-z]/i) || //alpha
							!postcode[3].match(/^\d$/) || //number
							!postcode[4].match(/[a-z]/i) || //alpha
							!postcode[5].match(/^\d$/) //number
						) {
							postcodeValid = false;
						}
					}
					//netherlands specific rule 'NNNN AA'
					else if (country === 'NL') {
						if (postcode.length != postcodeMax ||
							!postcode[0].match(/^\d$/) || //number
							!postcode[1].match(/^\d$/) || //number
							!postcode[2].match(/^\d$/) || //number
							!postcode[3].match(/^\d$/) || //number
							!postcode[4].match(/[a-z]/i) || //alpha
							!postcode[5].match(/[a-z]/i) //alpha
						) {
							postcodeValid = false;
						}
					}
					//poland specific rule 'NN-NNN'
					else if (country === 'PL') {
						postcode = postcode.splice(2, 0, '-');
						if (postcode.length != postcodeMax ||
							!postcode[0].match(/^\d$/) || //number
							!postcode[1].match(/^\d$/) || //number
							postcode[2] !== '-' || //hyphen
							!postcode[3].match(/^\d$/) || //number
							!postcode[4].match(/^\d$/) || //number
							!postcode[5].match(/^\d$/) //number
						) {
							postcodeValid = false;
						}
					}
					//sweden, slovakia and czech republic specific rule 'NNN NN'
					else if (country === 'SE' || country === 'SK' || country === 'CZ') {
						postcode = postcode.splice(3, 0, ' ');
						if (postcode.length != postcodeMax ||
							!postcode[0].match(/^\d$/) || //number
							!postcode[1].match(/^\d$/) || //number
							!postcode[2].match(/^\d$/) || //number
							postcode[3] !== ' ' || //space
							!postcode[4].match(/^\d$/) || //number
							!postcode[5].match(/^\d$/) //number
						) {
							postcodeValid = false;
						}
					}
					//south korea specific rule 'NNN-NNN'
					else if (country === 'KR') {
						postcode = postcode.splice(3, 0, '-');
						if (postcode.length != postcodeMax ||
							!postcode[0].match(/^\d$/) || //number
							!postcode[1].match(/^\d$/) || //number
							!postcode[2].match(/^\d$/) || //number
							postcode[3] !== '-' || //hyphen
							!postcode[4].match(/^\d$/) || //number
							!postcode[5].match(/^\d$/) || //number
							!postcode[6].match(/^\d$/) //number
						) {
							postcodeValid = false;
						}
					}

					break;
			}

			return postcodeValid;

		}

	};

});