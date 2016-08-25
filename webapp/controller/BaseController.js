sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/Dialog",
	"sap/m/Button",
	"sap/ui/core/BusyIndicator"
], function(Controller, JSONModel, Dialog, Button, BusyIndicator) {
	"use strict";

	return Controller.extend("zcustoview.controller.BaseController", {

		onInit: function() {
			// Initialise the countries data from the json file
			var oCountriesModel = new JSONModel();
			oCountriesModel.loadData("../webapp/model/countries.json");
			this.setModel(oCountriesModel, "countries");

			// Initialise the regions data from the json file
			var oRegionsModel = new JSONModel();
			oRegionsModel.loadData("../webapp/model/regions.json");
			this.setModel(oRegionsModel, "regions");

			// Initialise the titles data from the json file
			var oTitlesModel = new JSONModel();
			oTitlesModel.loadData("../webapp/model/titles.json");
			this.setModel(oTitlesModel, "titles");
			
			// Initialise the env data model (reads from an odata model and stores the first entry)
			var oEnv = new JSONModel();
			oEnv.setData({ minelabFlag: false }); //Default view is to hide minelab functionality
			this.setModel(oEnv, "env");

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
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
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
		}

	});

});