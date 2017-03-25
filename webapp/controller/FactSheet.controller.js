/*global location*/
sap.ui.define([
	"zcustoview/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"zcustoview/model/formatter",
	"zcustoview/model/postcodeValidator",
	"sap/ui/core/ValueState",
	"sap/m/MessageToast",
	"sap/m/Dialog",
	"sap/m/Button"
], function(
	BaseController,
	JSONModel,
	History,
	formatter,
	postcodeValidator,
	ValueState,
	MessageToast,
	Dialog,
	Button
) {
	"use strict";

	return BaseController.extend("zcustoview.controller.FactSheet", {

		formatter: formatter,
		postcodeValidator: postcodeValidator,

		_sAccountId: "",

		// Application names for navigation to Web Dynpro applications
		appNames: {
			rma: "zrm2_rma_document",
			displayReg: "zrm2_ui_serial_check",
			createReg: "z_warranty_reg_create"
		},

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
		onInit: function() {

			// Model used to manipulate control states. The chosen values make sure,
			// detail page is busy indication immediately so there is no break in
			// between the busy indication for loading the view's meta data
			var iOriginalBusyDelay,
				oViewModel = new JSONModel({
					busy: true,
					delay: 0,
					accountDetailsTitle: "",
					rmaDocumentsTitle: "",
					registrationsTitle: "",
					rmaUrl: "",
					displayRegUrl: "",
					createRegUrl: "",
					editMode: false
				});

			// Retrieve the URL details to navigate to the RMA Web dynpro in ERP
			// Once the environment info service is loaded, call function to populate the RMA URL
			var oEnvModel = this.getOwnerComponent().getModel("environmentInfo");

			if (oEnvModel) {

				oEnvModel.read("/EnvironmentInfos", {
					success: function(oData) {
						var oEntry = oData.results[0];

						if (oEntry) {
							oViewModel.setProperty("/rmaUrl",
								oEntry.baseUrl + oEntry.wdaPath + this.appNames.rma + oEntry.clientSuffix + "&RMA_ID=&FPM_EDIT_MODE=R#"
							);

							oViewModel.setProperty("/displayRegUrl",
								oEntry.baseUrl + oEntry.wdaPath + this.appNames.displayReg + oEntry.clientSuffix + "&SERIAL="
							);

							oViewModel.setProperty("/createRegUrl",
								oEntry.baseUrl + oEntry.wdaPath + this.appNames.createReg + oEntry.clientSuffix +
								"&sap-wd-configId=Z_WARRANTY_REG_CREATE_APP"
							);
						}
					}.bind(this)
				});

			}

			this.getRouter().getRoute("factSheet").attachPatternMatched(this._onObjectMatched, this);

			// Store original busy indicator delay, so it can be restored later on
			iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();
			this.setModel(oViewModel, "factSheetView");
			this.getOwnerComponent().getModel().metadataLoaded().then(function() {
				// Restore original busy indicator delay for the object view
				oViewModel.setProperty("/delay", iOriginalBusyDelay);
			});

			// Call the BaseController's onInit method (in particular to initialise the extra JSON models)
			BaseController.prototype.onInit.apply(this, arguments);

			// Turn off automatic update after change
			this.getOwnerComponent().getModel().setRefreshAfterChange(false);

			// Set the View back to the base controller (for validation methods)
			BaseController.prototype.setView(this.getView());

		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Event handler  for navigating back.
		 * It there is a history entry we go one step back in the browser history
		 * If not, it will replace the current entry of the browser history with the worklist route.
		 * @public
		 */
		onNavBack: function() {

			// Check for changes before navigating off the screen
			if (this.getModel().hasPendingChanges()) {
				this._showConfirmationDialog(
					this.getResourceBundle().getText("errorDialogTitle"),
					this.getResourceBundle().getText("msgDataLossConfirmation"),
					function() {
						this.getModel().resetChanges();
						this.getModel("factSheetView").setProperty("/editMode", false);
						this._navBack();
					}.bind(this)
				);
			} else {
				this._navBack();
			}

		},

		/**
		 * Event handler for selection of an RMADocument
		 * Navigate to the RMA Document in ERP
		 * @param {sap.ui.base.Event} oEvent the table selectionChange event
		 * @public
		 */
		onRmaDocumentSelect: function(oEvent) {
			var sRmaId = oEvent.getSource().getBindingContext().getProperty("rmaId");
			var sUrl = this.getModel("factSheetView").getProperty("/rmaUrl").replace("RMA_ID=", "RMA_ID=" + sRmaId);
			window.open(sUrl, "_blank");
		},

		/**
		 * Event handler for selection of a Registration
		 * Navigate to the Registration in ERP
		 * @param {sap.ui.base.Event} oEvent the table selectionChange event
		 * @public
		 */
		onRegistrationSelect: function(oEvent) {
			var sId = oEvent.getSource().getBindingContext().getProperty("boxSerial");
			var sUrl = this.getModel("factSheetView").getProperty("/displayRegUrl").replace("SERIAL=", "SERIAL=" + sId);
			window.open(sUrl, "_blank");
		},

		/**
		 * Event handler for press on Create button on Rma table
		 * Navigate to the RMA Create screen in ERP
		 * @public	
		 */
		onCreateRma: function() {

			if (!this.onSave()) {
				return;
			}

			if (!this._canRegister()) {
				// If the customer isn't editable, show a confirmation dialog
				this._showConfirmationDialog(
					this.getResourceBundle().getText("otherSalesOfficeDialogTitle"),
					this.getResourceBundle().getText("otherSalesOfficeConfirmation"),
					this._navigateToCreateRma.bind(this)
				);
			} else {
				this._navigateToCreateRma();
			}
		},

		/**
		 * Event handler for press on Create Registration button on Registration table
		 * Navigate to the Registration Create screen in ERP
		 * @public
		 */
		onCreateRegistration: function() {

			if (!this.onSave()) {
				return;
			}
			
			if (!this._canRegister()) {
				// If the customer isn't editable, show a confirmation dialog
				this._showConfirmationDialog(
					this.getResourceBundle().getText("otherSalesOfficeDialogTitle"),
					this.getResourceBundle().getText("otherSalesOfficeConfirmation"),
					this._navigateToCreateReg.bind(this)
				);

			} else {
				this._navigateToCreateReg();
			}

		},

		/**
		 * Triggered by the RMA table's 'updateFinished' event: after new table
		 * data is available, this handler method updates the table counter.
		 * This should only happen if the update was successful, which is
		 * why this handler is attached to 'updateFinished' and not to the
		 * table's list binding's 'dataReceived' method.
		 * @param {sap.ui.base.Event} oEvent the update finished event
		 * @public
		 */
		onRmaUpdateFinished: function(oEvent) {
			// update the search's object counter after the table update
			var sTitle,
				oTable = oEvent.getSource(),
				iTotalItems = oEvent.getParameter("total");
			// only update the counter if the length is final and
			// the table is not empty
			if (iTotalItems && oTable.getBinding("items").isLengthFinal()) {
				sTitle = this.getResourceBundle().getText("factSheetRmaDocuments", [iTotalItems]);
			} else {
				sTitle = this.getResourceBundle().getText("factSheetRmaDocuments", ["0"]);
			}
			this.getModel("factSheetView").setProperty("/rmaDocumentsTitle", sTitle);
		},

		/**
		 * Triggered by the Registration table's 'updateFinished' event: after new table
		 * data is available, this handler method updates the table counter.
		 * This should only happen if the update was successful, which is
		 * why this handler is attached to 'updateFinished' and not to the
		 * table's list binding's 'dataReceived' method.
		 * @param {sap.ui.base.Event} oEvent the update finished event
		 * @public
		 */
		onRegUpdateFinished: function(oEvent) {
			// update the search's object counter after the table update
			var sTitle,
				oTable = oEvent.getSource(),
				iTotalItems = oEvent.getParameter("total");
			// only update the counter if the length is final and
			// the table is not empty
			if (iTotalItems && oTable.getBinding("items").isLengthFinal()) {
				sTitle = this.getResourceBundle().getText("factSheetRegistrations", [iTotalItems]);
			} else {
				sTitle = this.getResourceBundle().getText("factSheetRegistrations", ["0"]);
			}
			this.getModel("factSheetView").setProperty("/registrationsTitle", sTitle);
		},

		/**
		 * Triggered by pressing the refresh button on the rma table
		 * Refreshes the rma table binding
		 * @public
		 */
		onRmaRefresh: function() {
			this.getView().byId("rmaDocumentsTable").getBinding("items").refresh();
		},

		/**
		 * Triggered by pressing the refresh button on the product registrations table
		 * Refreshes the product registrations binding
		 * @public
		 */
		onRegistrationsRefresh: function() {
			this.getView().byId("registrationsTable").getBinding("items").refresh();
		},

		/**
		 * Triggered by pressing the edit mode button on the customer details view
		 * If in edit mode - raises a confirmation dialog
		 * If not in edit mode, turns edit mode on
		 * @public
		 */
		onToggleEditMode: function() {

			var bEditMode = this.getModel("factSheetView").getProperty("/editMode");

			if (bEditMode) {
				// Show a dialog if there are pending changes
				if (this.getModel().hasPendingChanges()) {
					this._showConfirmationDialog(
						this.getResourceBundle().getText("errorDialogTitle"),
						this.getResourceBundle().getText("msgDataLossConfirmation"),
						function() {
							this.getModel().resetChanges();
							this.getModel("factSheetView").setProperty("/editMode", false);
						}.bind(this)
					);
				} else {
					this.getModel("factSheetView").setProperty("/editMode", false);
				}
			} else {
				this.getModel("factSheetView").setProperty("/editMode", true);
			}
		},

		/**
		 * Triggered when the customer is in edit mode and elects to Save the current customer
		 * May also be triggered when navigating to a new RMA or new Warranty registration
		 * @returns {boolean} Success of the validation
		 * @public
		 */
		onSave: function() {
			
			// If we are not in edit mode, ignore the request
			if (this.getModel("factSheetView").getProperty("/editMode") === false) {
				return true;	
			}
			var oContext = this.getView().getBindingContext();

			// First check all mandatory fields are entered
			var bValid = BaseController.prototype.checkMandatoryFields(oContext);

			// If all mandatory fields are entered, check that the postcode is valid.
			if (bValid) {
				bValid = this._checkPostcode();
			}
			
			// Check that the email address is valid
		    var bEmailValid = this._checkEmail();
			if (!bEmailValid) {
					this.getModel("errorState").setProperty("/email/state", sap.ui.core.ValueState.Error);
    				this.getModel("errorState").setProperty("/email/text", this.getResourceBundle().getText("txtEmailIncorrectFormat"));
			}
			
			if (bValid && !bEmailValid) {
				bValid = false;
			}

			if (!bValid) {
				this.raiseErrorDialog(this.getResourceBundle().getText("msgEnterMandatoryFields"));
			} else {

				this.getModel().submitChanges({
					success: function() {
						MessageToast.show("The data was saved successfully");
						this.getModel("factSheetView").setProperty("/editMode", false);
					}.bind(this),
					error: function() {
						MessageToast.show("An unknown error occurred - the data has not been saved. Please refresh the application and try again.");
						this.getModel().resetChanges();
					}.bind(this)
				});

			}

			return bValid;

		},

		/**
		 * Triggered when the postcode value is changed
		 * Validates the postcode and sets the error state of the control accordingly
		 * @public
		 */
		onPostcodeChange: function() {

			this._checkPostcode();

		},

		/* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */

		/**
		 * Binds the view to the object path.
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_onObjectMatched: function(oEvent) {
			this._sAccountId = oEvent.getParameter("arguments").objectId;
			this.getModel().metadataLoaded().then(function() {
				var sObjectPath = this.getModel().createKey("Customers", {
					account: this._sAccountId
				});
				this._bindView("/" + sObjectPath);
			}.bind(this));

			this.getModel("factSheetView").setProperty("/accountDetailsTitle",
				this.getResourceBundle().getText("factSheetAccountDetails", [this._sAccountId])
			);

			// Reset the edit mode
			this.getModel("factSheetView").setProperty("/editMode", false);
			this.resetErrorStates();

		},

		/**
		 * Binds the view to the object path.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound
		 * @private
		 */
		_bindView: function(sObjectPath) {
			var oViewModel = this.getModel("factSheetView"),
				oDataModel = this.getModel();

			this.getView().bindElement({
				path: sObjectPath,
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: function() {
						oDataModel.metadataLoaded().then(function() {
							// Busy indicator on view should only be set if metadata is loaded,
							// otherwise there may be two busy indications next to each other on the
							// screen. This happens because route matched handler already calls '_bindView'
							// while metadata is loaded.
							oViewModel.setProperty("/busy", true);
						});
					},
					dataReceived: function() {
						oViewModel.setProperty("/busy", false);
					}
				}
			});

		},

		_onBindingChange: function() {
			var oView = this.getView(),
				oViewModel = this.getModel("factSheetView"),
				oElementBinding = oView.getElementBinding();

			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("objectNotFound");
				return;
			}

			var oResourceBundle = this.getResourceBundle(),
				oObject = oView.getBindingContext().getObject(),
				sObjectId = oObject.customer,
				sObjectName = oObject.customer;

			// Everything went fine.
			oViewModel.setProperty("/busy", false);
			oViewModel.setProperty("/shareSendEmailSubject",
				oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
			oViewModel.setProperty("/shareSendEmailMessage",
				oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectName, sObjectId, location.href]));

			// Set the RMA Documents title
			oViewModel.setProperty("/rmaDocumentsTitle",
				this.getResourceBundle().getText("factSheetRmaDocuments",
					this.byId("rmaDocumentsTable").getBinding("items").getLength().toString())
			);

			// Set the Registrations title
			oViewModel.setProperty("/registrationsTitle",
				this.getResourceBundle().getText("factSheetRegistrations",
					this.byId("registrationsTable").getBinding("items").getLength().toString())
			);

			// Set up the region filter if the user hits edit mode
			this.setRegionFilter(this.byId("selRegion"), this.getView().getBindingContext().getProperty("country"));
		},

		/**
		 * Helper function to determine if the user can register a new repair or warranty registration
		 * @private
		 */
		_canRegister: function() {

			return (this.getView().getBindingContext().getProperty("isEditable") ||
				(this.getView().getBindingContext().getProperty("isEditableReason").indexOf("logged on user") < 0)
			);

		},

		/**
		 * Validate the postcode in the current model, based on the country
		 * @private
		 */
		_checkPostcode: function() {

			var oContext = this.getView().getBindingContext();
			return BaseController.prototype.validatePostcode(this.getModel("countries"),
				oContext.getProperty("country"),
				oContext.getProperty("postcode")
			);

		},
		
		/**
		 * Validate the email address in the current model
		 * @private
		 */
		_checkEmail: function() {
			var oContext = this.getView().getBindingContext();
			return BaseController.prototype.validateEmail(oContext.getProperty("email"));
		},

		/**
		 * Navigate back to the Search screen
		 * @private
		 */
		_navBack: function() {

			var sPreviousHash = History.getInstance().getPreviousHash();

			if (sPreviousHash !== undefined) {
				history.go(-1);
			} else {
				this.getRouter().navTo("search", {}, true);
			}

		},

		/**
		 * Display a confirmation dialog to the user
		 * @param {String} sTitle Title of the dialog
		 * @param {String} sMessageText Main text body of the dialog
		 * @param {function} fSuccess Handler for if the user selects OK
		 * @private
		 */
		_showConfirmationDialog: function(sTitle, sMessageText, fSuccess) {

			var functionAfterClose = fSuccess;

			var dialog = new Dialog({
				title: sTitle,
				type: "Message",
				state: "Warning",
				id: "dataLossDialog",
				content: new sap.m.Text({
					text: sMessageText
				}),
				beginButton: new Button({
					text: this.getResourceBundle().getText("dialogOk"),
					press: function() {
						if (functionAfterClose) {
							functionAfterClose.call();
						}
						dialog.close();
					}
				}),
				endButton: new Button({
					text: this.getResourceBundle().getText("btnCancel"),
					press: function() {
						dialog.close();
					}
				})
			});
			dialog.attachAfterClose(this, function() {
				dialog.destroy();
			}, this);

			dialog.open();

		},

		/**
		 * Navigates to the Create RMA web application in a new window
		 * Called when the user hits the create RMA button, or confirms the Other Sales Office dialog
		 * @private
		 */

		_navigateToCreateRma: function() {
			var sUrl = this.getModel("factSheetView").getProperty("/rmaUrl")
				.replace("FPM_EDIT_MODE=R", "FPM_EDIT_MODE=C")
				.replace("RMA_ID=", "CUSTOMER_ID=" + this._sAccountId);

			window.open(sUrl, "_blank");
		},

		/**
		 * Navigates to the Create Registartion web application in a new window
		 * Called when the user hits the create Registration button, or confirms the Other Sales Office dialog
		 * @private
		 */
		_navigateToCreateReg: function() {

			var sUrl = this.getModel("factSheetView").getProperty("/createRegUrl") + "&KUNNR=" + this._sAccountId;
			window.open(sUrl, "_blank");
		}

	});

});