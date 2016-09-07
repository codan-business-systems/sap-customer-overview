sap.ui.define([
	"zcustoview/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"zcustoview/model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/core/routing/History",
	"sap/m/Button",
	"sap/m/MessageToast"
], function(BaseController, JSONModel, formatter, Filter, FilterOperator, History, Button, MessageToast) {
	"use strict";

	return BaseController.extend("zcustoview.controller.Search", {

		formatter: formatter,

		// Variable to store the context for customer creation
		_oContext: null,

		// Reference to the Create New Customer dialog
		_oCreateCustomerDialog: null,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the search controller is instantiated.
		 * @public
		 */
		onInit: function() {
			var oViewModel,
				iOriginalBusyDelay,
				oTable = this.byId("searchResultsTable");

			// Put down search table's original value for busy indicator delay,
			// so it can be restored later on. Busy handling on the table is
			// taken care of by the table itself.
			iOriginalBusyDelay = oTable.getBusyIndicatorDelay();
			this._oTable = oTable;
			// keeps the search state
			this._oTableSearchState = [];

			// Model used to manipulate control states and store search criteria
			oViewModel = new JSONModel({
				searchTableTitle: this.getResourceBundle().getText("searchTableTitle"),
				saveAsTileTitle: this.getResourceBundle().getText("searchViewTitle"),
				shareOnJamTitle: this.getResourceBundle().getText("searchViewTitle"),
				shareSendEmailSubject: this.getResourceBundle().getText("shareSendEmailSearchSubject"),
				shareSendEmailMessage: this.getResourceBundle().getText("shareSendEmailSearchMessage", [location.href]),
				tableNoDataText: this.getResourceBundle().getText("tableNoDataText"),
				tableBusyDelay: 0,
				showCreateCustomer: false,
				criteria: {} // Populated in _initSearchCriteria
			});

			this.setModel(oViewModel, "searchView");

			this._initSearchCriteria();

			// Call the BaseController's onInit method (in particular to initialise the extra JSON models)
			BaseController.prototype.onInit.apply(this, arguments);

			// Ensure the default filtering is set on the region
			this.setRegionFilter(this.byId("selRegion"), "");
			this.setRegionFilter(sap.ui.getCore().byId("dlgSelRegion"), "");

			// Make sure, busy indication is showing immediately so there is no
			// break after the busy indication for loading the view's meta data is
			// ended (see promise 'oWhenMetadataIsLoaded' in AppController)
			oTable.attachEventOnce("updateFinished", function() {
				// Restore original busy indicator delay for search's table
				oViewModel.setProperty("/tableBusyDelay", iOriginalBusyDelay);
			});

			BaseController.prototype.setView(this.getView());

		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Triggered by the table's 'updateFinished' event: after new table
		 * data is available, this handler method updates the table counter.
		 * This should only happen if the update was successful, which is
		 * why this handler is attached to 'updateFinished' and not to the
		 * table's list binding's 'dataReceived' method.
		 * @param {sap.ui.base.Event} oEvent the update finished event
		 * @public
		 */
		onUpdateFinished: function(oEvent) {
			// update the search's object counter after the table update
			var sTitle,
				oTable = oEvent.getSource(),
				iTotalItems = oEvent.getParameter("total");
			// only update the counter if the length is final and
			// the table is not empty
			if (iTotalItems && oTable.getBinding("items").isLengthFinal()) {
				sTitle = this.getResourceBundle().getText("searchTableTitleCount", [iTotalItems]);
			} else {
				sTitle = this.getResourceBundle().getText("searchTableTitle");
			}
			this.getModel("searchView").setProperty("/searchTableTitle", sTitle);
		},

		/**
		 * Event handler when the search button is pressed
		 * @public
		 */
		onSearch: function() {

			//Retrieve the entered properties from the searchView model
			//and map to a filters array
			var aFilters = [];

			//Check that a "strong" search criteria has been entered
			var bStrong = false;

			var aFilterLength = 0;

			// Serial No
			aFilters = this._addFilter("serialNumber", aFilters);
			if (aFilters.length > aFilterLength) {
				bStrong = true;
				aFilterLength = aFilters.length;
			}

			// Account
			aFilters = this._addFilter("name", aFilters);
			if (aFilters.length > aFilterLength) {
				bStrong = true;
				aFilterLength = aFilters.length;
			}

			// Country
			aFilters = this._addFilter("country", aFilters);
			aFilterLength = aFilters.length;

			// Transaction (RMA) ID
			aFilters = this._addFilter("rmaId", aFilters);
			if (aFilters.length > aFilterLength) {
				bStrong = true;
				aFilterLength = aFilters.length;
			}

			// Postcode
			aFilters = this._addFilter("postcode", aFilters);
			if (aFilters.length > aFilterLength) {
				bStrong = true;
				aFilterLength = aFilters.length;
			}

			// Region
			aFilters = this._addFilter("region", aFilters);
			aFilterLength = aFilters.length;

			// Telephone
			aFilters = this._addFilter("telephone", aFilters);
			if (aFilters.length > aFilterLength) {
				bStrong = true;
				aFilterLength = aFilters.length;
			}

			// Email
			aFilters = this._addFilter("email", aFilters);
			if (aFilters.length > aFilterLength) {
				bStrong = true;
				aFilterLength = aFilters.length;
			}

			if (aFilters.length === 0) {
				this.raiseErrorDialog(this.getResourceBundle().getText("noSearchCriteria"));
				return;
			}

			if (!bStrong) {
				this.raiseErrorDialog(this.getResourceBundle().getText("notEnoughSearchCriteria"));
				return;
			}

			// Also add the archived flag
			aFilters.push(new sap.ui.model.Filter("archived", sap.ui.model.FilterOperator.EQ, this.getModel("searchView").getProperty(
				"/criteria/archived")));

			// Update the table binding
			this.getView().byId("searchResultsTable").getBinding("items").filter(aFilters);
		},

		/**
		 * Event handler for when the country selection is change
		 * @param {sap.ui.core.Item} oEvent Control that fired the event
		 * @public
		 */
		onCountrySelect: function(oEvent) {
			// Ensure that the region filter is set
			if (this._oCreateCustomerDialog && this._oCreateCustomerDialog.isOpen()) {
				this.setRegionFilter(sap.ui.getCore().byId("dlgSelRegion"), oEvent.getParameters().selectedItem.getKey());

				oEvent.getSource().removeStyleClass("selectError");
			} else {
				this.setRegionFilter(this.byId("selRegion"), oEvent.getParameters().selectedItem.getKey());
			}

		},

		/**
		 * Event handler on press of the Create Customer button
		 * Navigates to the Create Customer dialog
		 * @public
		 */
		onCreateCustomer: function() {

			// Instantiate the Create New Customer dialog
			if (!this._oCreateCustomerDialog) {
				this._oCreateCustomerDialog = sap.ui.xmlfragment("zcustoview.view.CreateCustomer", this);
				this._oCreateCustomerDialog.addButton(
					new Button({
						text: "{i18n>btnCreateCustomer}",
						press: this.onSubmitCustomer.bind(this),
						type: "Accept"
					}));
				this._oCreateCustomerDialog.addButton(
					new Button({
						text: "{i18n>btnCancel}",
						press: this.onCancel.bind(this),
						type: "Reject"
					}));
				this.getView().addDependent(this._oCreateCustomerDialog);
			}

			//	Create a new entry in the model
			this._oContext = this.getModel().createEntry("Customers", {});
			this.getView().setBindingContext(this._oContext);

			// Reset the region filter
			this.setRegionFilter(sap.ui.getCore().byId("dlgSelRegion"), "");

			// Reset the error states
			BaseController.prototype.resetErrorStates();

			this._oCreateCustomerDialog.open();

		},

		/**
		 * Event handler when a table item gets pressed
		 * @param {sap.ui.base.Event} oEvent the table selectionChange event
		 * @public
		 */
		onPress: function(oEvent) {
			// The source is the list item that got pressed
			this._showObject(oEvent.getSource());
		},

		/**
		 * Event handler for navigating back.
		 * We navigate back in the browser historz
		 * @public
		 */
		onNavBack: function() {
			history.go(-1);
		},

		/**
		 * Event handler for refresh event. Keeps filter, sort
		 * and group settings and refreshes the list binding.
		 * @public
		 */
		onRefresh: function() {
			this._oTable.getBinding("items").refresh();
		},

		/**
		 * Event handler to submit customer creation to the model
		 * @public
		 */
		onSubmitCustomer: function() {

			var oContext = this._oContext;

			// Check all mandatory fields are entered
			var bValid = BaseController.prototype.checkMandatoryFields(oContext);

			// If all mandatory fields are entered, check that the postcode is valid.
			if (bValid) {
				bValid = this._checkPostcode();
			}

			if (!bValid) {

				// Custom check for country key so that we can apply CSS to the Country select
				sap.ui.getCore().byId("country").toggleStyleClass("selectError", this.getModel("errorState").getProperty("/country/state") === sap
					.ui.core.ValueState.Error);

				this.raiseErrorDialog(this.getResourceBundle().getText("msgEnterMandatoryFields"));
				return bValid;
			}
			this.getModel().submitChanges({
				success: function() {
					
					// Get the new customer number
					var sAccount = this._oContext.getObject().account;

					// Show success message
					MessageToast.show(this.getResourceBundle().getText("msgCustomerCreated", sAccount), {
						duration: 10000
					});

					this.getRouter().navTo("factSheet", {
						objectId: sAccount
					});
				}.bind(this)
			});
		},

		/**
		 * Event handler to cancel the customer creation (closing the dialog)
		 * @public
		 */
		onCancel: function() {
			this.getModel().deleteCreatedEntry(this._oContext);
			if (this._oCreateCustomerDialog) {
				this._oCreateCustomerDialog.close();
			}
		},

		/**
		 * Event handler to clear selection criteria
		 * @public
		 */
		onClearSearch: function() {
			this._initSearchCriteria();
		},

		/* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */

		/**
		 * Shows the selected item on the object page
		 * On phones a additional history entry is created
		 * @param {sap.m.ObjectListItem} oItem selected Item
		 * @private
		 */
		_showObject: function(oItem) {
			this.getRouter().navTo("factSheet", {
				objectId: oItem.getBindingContext().getProperty("account")
			});
		},

		/**
		 * Adds a filter option to a filter array if the specified value is not blank
		 * @param {string} sProperty Property value to be retrieved from the model
		 * @param {array} aFilters array of Filter objets
		 * @returns {array} Modified array of Filter objects
		 * @private
		 */
		_addFilter: function(sProperty, aFilters) {

			var sValue = this.getModel("searchView").getProperty("/criteria/" + sProperty);
			if (sValue && sValue !== "") {
				aFilters.push(new sap.ui.model.Filter(sProperty, this._deriveFilterOperator(sProperty, sValue), sValue.replace(new RegExp("[\*]+",
					'g'), "")));
			}
			return aFilters;
		},

		/**
		 * Validate the entered postcode in the Create Customer Dialog, based on the country rule
		 * @returns {Boolean} True if valid
		 */
		_checkPostcode: function() {
			var oContext = this.getView().getBindingContext();
			return BaseController.prototype.validatePostcode(this.getModel("countries"),
				oContext.getProperty("country"),
				oContext.getProperty("postcode")
			);
		},

		/**
		 * Determines the filter operator based on where the wildcard operators are entered in the
		 * search string, and whether the parameter should be an exact parameter
		 * @param {string} sParam   Search Parameter
		 * @param {string} sSearch	Search String
		 * @returns {sap.ui.model.FilterOperator} Filter Operator
		 */
		_deriveFilterOperator: function(sParam, sSearch) {

			var oResult = null;

			// These parameters are exact matches
			if (sParam === "country" || sParam === "region" || sParam === "serialNumber" || sParam === "rmaId") {
				oResult = sap.ui.model.FilterOperator.EQ;
			} else {

				// If the search string has a * at the start only
				if (sSearch.search(/^\*.+[^\*]$/) === 0) {
					oResult = sap.ui.model.FilterOperator.EndsWith;
				} else

				// If the search string has a * at the end only
				if (sSearch.search(/^[^\*].+\*$/) === 0) {
					oResult = sap.ui.model.FilterOperator.StartsWith;
				} else {
					// Just use contains
					oResult = sap.ui.model.FilterOperator.Contains;
				}

			}

			return oResult;

		},

		/**
		 * Clears/initialises the search criteria values for the search view
		 * @private
		 */

		_initSearchCriteria: function() {
			this.getModel("searchView").setProperty("/criteria", {
				serialNumber: "",
				name: "",
				country: "",
				rmaId: "",
				street: "",
				city: "",
				postcode: "",
				region: "",
				telephone: "",
				email: "",
				archived: false
			});
		}

	});
});