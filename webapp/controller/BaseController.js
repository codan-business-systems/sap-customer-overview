sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/Dialog",
	"sap/m/Button",
	"sap/ui/core/BusyIndicator",
	"sap/ui/core/ValueState",
	"zcustoview/model/postcodeValidator"
], function(Controller, JSONModel, Dialog, Button, BusyIndicator, ValueState, postcodeValidator) {
	"use strict";

	return Controller.extend("zcustoview.controller.BaseController", {
		
		// The following fields are mandatory on both Create Customer and Change Customer modes
		mandatoryFields: [
			"name",
			"street",
			"city",
			"postcode",
			"country"
		],
		
		// The following input fields need to reflect the mandatory fields specified above
		// Set by the child controllers
		mandatoryInputs : [],
		
		postcodeValidator: postcodeValidator,
		
		// Stores the current state of errors on input fields
		_oErrorStateModel : new JSONModel(),

		onInit: function() {
			
			// Initialise the countries data from the json file
			var oCountriesModel = new JSONModel({
				bCache: true
			});
			oCountriesModel.loadData("../webapp/model/countries.json");
			oCountriesModel.setSizeLimit(9999);
			this.setModel(oCountriesModel, "countries");

			// Initialise the regions data from the json file
			var oRegionsModel = new JSONModel({
				bCahce: true
			});
			oRegionsModel.loadData("../webapp/model/regions.json");
			oRegionsModel.setSizeLimit(9999);
			this.setModel(oRegionsModel, "regions");

			// Initialise the titles data from the json file
			var oTitlesModel = new JSONModel({
				bCache: true
			});
			oTitlesModel.loadData("../webapp/model/titles.json");
			this.setModel(oTitlesModel, "titles");
			
			// Initialise the env data model (reads from an odata model and stores the first entry)
			var oEnv = new JSONModel();
			oEnv.setData({ minelabFlag: false }); //Default view is to hide minelab functionality
			this.setModel(oEnv, "env");
			
			// Initialise the error state model, which stores the error state of UI fields
			this.setModel(this._oErrorStateModel, "errorState");
			this.resetErrorStates();

			// Check that the user has a valid sales office assignment
			// Set Busy Indicator immediately while we do this check
			BusyIndicator.show(0);
			var oEnvModel = this.getOwnerComponent().getModel("environmentInfo");

			if (oEnvModel) {

				oEnvModel.read("/EnvironmentInfos", {
					success: function(oData) {
						this.getModel("env").setData(oData.results[0],false);
						BusyIndicator.hide();
					}.bind(this),
					error: function() {
						this.raiseErrorDialog(this.getResourceBundle().getText("noSalesOfficeAssignment"));
					}.bind(this)
				});

			}

		},

		/**
		 * Convenience method for accessing the router.
		 * @public
		 * @returns {sap.ui.core.routing.Router} the router for this component
		 */
		getRouter: function() {
			return sap.ui.core.UIComponent.getRouterFor(this);
		},

		/**
		 * Convenience method for getting the view model by name.
		 * @public
		 * @param {string} [sName] the model name
		 * @returns {sap.ui.model.Model} the model instance
		 */
		getModel: function(sName) {
			return this.getView().getModel(sName);
		},

		/**
		 * Convenience method for setting the view model.
		 * @public
		 * @param {sap.ui.model.Model} oModel the model instance
		 * @param {string} sName the model name
		 * @returns {sap.ui.mvc.View} the view instance
		 */
		setModel: function(oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},

		/**
		 * Getter for the resource bundle.
		 * @public
		 * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
		 */
		getResourceBundle: function() {
			if (this.getOwnerComponent()) {
				return this.getOwnerComponent().getModel("i18n").getResourceBundle();
			}
			
			return this.oView.getModel("i18n").getResourceBundle();
		},

		/**
		 * Event handler when the share by E-Mail button has been clicked
		 * @public
		 */
		onShareEmailPress: function() {
			var oViewModel = (this.getModel("objectView") || this.getModel("worklistView"));
			sap.m.URLHelper.triggerEmail(
				null,
				oViewModel.getProperty("/shareSendEmailSubject"),
				oViewModel.getProperty("/shareSendEmailMessage")
			);
		},
		
		/**
		 * Check all mandatory fields have been entered
		 * Mandatory fields are defined in array mandatoryFields
		 * Input fields associated with mandatory values are defined in array mandatoryInouts
		 * @param {Object} oContext Binding context for the view
		 * @returns {boolean} True if all mandatory fields have values
		 */
		checkMandatoryFields: function(oContext) {
			
			var bResult = false;
			
			this.resetErrorStates();
			
			if (!oContext) {
				return bResult;
			}
			
			this.mandatoryFields.forEach( function(prop) {
				
				// Validate that the field has a value
				if (!oContext.getProperty(prop)) {
					this.setErrorState(prop, ValueState.Error, prop.toUpperCase() + " is a mandatory field");				
					bResult = true;
				} 
			}.bind(this));
			
			return !bResult;
		},
		
		/**
		 * Triggered when a mandatory field is changed
		 * Resets the value state on the input box if a value was entered
		 * Or sets it to error if no value entered
		 * @param {Object} oEvent event parameters
		 * @public
		 */
		onFieldChange : function(oEvent) {
			
			var oControl = sap.ui.getCore().byId(oEvent.getParameters().id);
			var sValueStatePath = oControl.getBindingPath("valueState");
			var sValueStateTextPath = oControl.getBindingPath("valueStateText");
			var valueState =  ValueState.None;
			var valueStateText = "";
			
			if (!(oEvent.getParameters().newValue)) {
				valueState = ValueState.Error;
				valueStateText = this.getResourceBundle().getText("txtMandatoryField", [oControl.getBindingPath("value").toUpperCase()] );
			}
			
			this.getModel("errorState").setProperty(sValueStatePath, valueState);
			this.getModel("errorState").setProperty(sValueStateTextPath, valueStateText);
		},
		
		
		/**
		 * Raises an error message dialog with the message text specified
		 * @param {string} sText Error Message to Display
		 * @param {function} fAfterClose? Function to perform after close
		 * @private
		 */
		raiseErrorDialog: function(sText, fAfterClose) {
			
			var functionAfterClose = fAfterClose;
		
			var dialog = new Dialog({
				title: this.getResourceBundle().getText("errorDialogTitle"),
				type: "Message",
				state: "Error",
				id: "errorDialog",
				content: new sap.m.Text({
					text: sText
				}),
				beginButton: new Button({
					text: this.getResourceBundle().getText("dialogOk"),
					press: function() {
						dialog.close();
					}
				})
			});
			
			if (!functionAfterClose) {
				functionAfterClose = function() {
					dialog.destroy();
				};
			}
			dialog.attachAfterClose(this, functionAfterClose, this);

			dialog.open();
		},
		
		/**
		 * Reset the error states of the UI
		 * @public
		 */
		resetErrorStates: function( ) {
			
			this._oErrorStateModel.setData({
				name: {
					state: ValueState.None,
					text: ""
				},
				street: {
					state: ValueState.None,
					text: ""
				},
				city: {
					state: ValueState.None,
					text: ""
				},
				postcode: {
					state: ValueState.None,
					text: ""
				},
				country: {
					state: ValueState.None,
					text: ""
				}
			});
		
		},
		
		/**
		 * Set the value state of a property using the error state model
		 * @param {string} prop Property name to be set
		 * @param {sap.ui.core.ValueState} Value State to be set
		 * @param {string} text Value State Text to be set
		 * @public
		 */
		
		setErrorState: function(prop, valueState, text) {
			this._oErrorStateModel.setProperty("/" + prop + "/state", valueState);
			this._oErrorStateModel.setProperty("/" + prop + "/text", text);    
		},
		
		/**
		 * Ensures the region filter on the specified control is set based on the selected Country key
		 * @param {Object} oControl control to change the binding on
		 * @param {string} sCountryKey Key of the country selected
		 * @public
		 */
		setRegionFilter: function(oControl, sCountryKey) {
			
			if (!oControl) {
				return;
			}

			var oBinding = oControl.getBinding("items");

			if (!oBinding) {
				return;
			}

			var aFilters = [];
			// Always start with a blank value
			aFilters.push(new sap.ui.model.Filter("country", sap.ui.model.FilterOperator.EQ, ""));

			// If a country key is passed, add that as well
			if (sCountryKey && sCountryKey !== "") {
				aFilters.push(new sap.ui.model.Filter("country", sap.ui.model.FilterOperator.EQ, sCountryKey));
			}

			oBinding.filter(new sap.ui.model.Filter({
				filters: aFilters,
				and: false
			}));

		},
		
		setView: function(oView) {
			this.oView = oView;
			return oView;
		},
		
		/**
		 * Validate the postcode based on the country key specified
		 * @param {sap.ui.model.json.JSONModel) oCountries => Model with the country data
		 * @param {String} sCountryKey => Key of the country 
		 * @param {String} sPostcode => Postcode to validate
		 * @returns {Boolean} True if valid
		 */
		validatePostcode: function(oCountries, sCountryKey, sPostcode) {
				var bValid = postcodeValidator.validatePostcode(oCountries, 
														    	sCountryKey, 
														    	sPostcode
				);
				
				if (!bValid) {
					this.setErrorState("postcode", ValueState.Error,
						this.getResourceBundle().getText("msgInvalidPostcode"));
			    } else {
			    	this.setErrorState("postcode", ValueState.None, "");
				}
				
				return bValid;
		}

	});

});