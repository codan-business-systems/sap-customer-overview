/*global location*/
sap.ui.define([
	"zcustoview/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"zcustoview/model/formatter"
], function(
	BaseController,
	JSONModel,
	History,
	formatter
) {
	"use strict";

	return BaseController.extend("zcustoview.controller.FactSheet", {

		formatter: formatter,
		
		_sAccountId: "",

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
					rmaUrl: ""
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
								oEntry.baseUrl + oEntry.wdaPath + "zrm2_rma_document" + oEntry.clientSuffix + "&RMA_ID=&FPM_EDIT_MODE=R#"
							);
						}
					}
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
			var sPreviousHash = History.getInstance().getPreviousHash();

			if (sPreviousHash !== undefined) {
				history.go(-1);
			} else {
				this.getRouter().navTo("search", {}, true);
			}
		},

		/**
		 * Event handler for selection of an RMADocument
		 * Navigate to the RMA Document in ERP
		 * @param {sap.ui.base.Event} oEvent the table selectionChange event
		 * @public
		 */
		onRmaDocumentSelect: function(oEvent) {
			var oRmaId = oEvent.getSource().getBindingContext().getProperty("rmaId");
			var sUrl = this.getModel("factSheetView").getProperty("/rmaUrl").replace("RMA_ID=", "RMA_ID=" + oRmaId);
			window.open(sUrl, "_blank");
		},
		
		/**
		 * Event handler for press on Create button on Rma table
		 * Navigate to the RMA Create screen in ERP
		 * @public
		 */
		onCreateRma: function() {
<<<<<<< HEAD
			var sUrl = this.getModel("factSheetView").getProperty("/rmaUrl")
						.replace("FPM_EDIT_MODE=R","FPM_EDIT_MODE=C")
						.replace("RMA_ID=","CUSTOMER_ID=" + this._sAccountId);
=======
			var sUrl = this.getModel("factSheetView").getProperty("/rmaUrl").replace("FPM_EDIT_MODE=R","FPM_EDIT_MODE=C");
>>>>>>> branch 'master' of https://github.com/themanmountain/sap-customer-overview
			window.open(sUrl, "_blank");
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
		 * Triggered by pressing the refresh button on the rma tabl
		 * Refreshes the rma table binding
		 * @public
		 */ 
		onRmaRefresh: function() {
			this.getView().byId("rmaDocumentsTable").getBinding("items").refresh();
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

			oViewModel.setProperty("/rmaDocumentsTitle",
				this.getResourceBundle().getText("factSheetRmaDocuments", ["0"])
			);
		}

	});

});
