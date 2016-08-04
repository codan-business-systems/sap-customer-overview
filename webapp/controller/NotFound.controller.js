sap.ui.define([
		"zcustoview/controller/BaseController"
	], function (BaseController) {
		"use strict";

		return BaseController.extend("zcustoview.controller.NotFound", {

			/**
			 * Navigates to the worklist when the link is pressed
			 * @public
			 */
			onLinkPressed : function () {
				this.getRouter().navTo("worklist");
			}

		});

	}
);