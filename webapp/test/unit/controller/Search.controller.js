sap.ui.define([
	"zcustoview/controller/Search.controller",
	"zcustoview/controller/BaseController",
	"sap/ui/base/ManagedObject",
	"test/unit/helper/FakeI18nModel",
	"sap/ui/thirdparty/sinon",
	"sap/ui/thirdparty/sinon-qunit"
], function(SearchController, BaseController, ManagedObject, FakeI18n) {
	"use strict";

	QUnit.module("Table busy indicator delay", {

		beforeEach: function() {
			this.oSearchController = new SearchController();
			this.oTableStub = new ManagedObject();
			this.oTableStub.getBusyIndicatorDelay = sinon.stub();
			this.oViewStub = new ManagedObject();
			this.oComponentStub = new ManagedObject();
			this.oComponentStub.setModel(new FakeI18n(), "i18n");

			sinon.stub(this.oSearchController, "getOwnerComponent").returns(this.oComponentStub);
			sinon.stub(this.oSearchController, "getView").returns(this.oViewStub);
			sinon.stub(this.oSearchController, "byId").returns(this.oTableStub);
		},

		afterEach: function() {
			this.oSearchController.destroy();
			this.oTableStub.destroy();
			this.oViewStub.destroy();
			this.oComponentStub.destroy();
		}
	});

	QUnit.test("Should set the initial busyindicator delay to 0", function(assert) {
		// Act
		this.oSearchController.onInit();

		// Assert
		assert.strictEqual(this.oSearchController.getModel("searchView").getData().tableBusyDelay, 0, "The original busy delay was restored");
	});

	QUnit.test("Should reset the busy indicator to the original one after the first request completed", function(assert) {
		// Arrange
		var iOriginalBusyDelay = 1;

		this.oTableStub.getBusyIndicatorDelay.returns(iOriginalBusyDelay);

		// Act
		this.oSearchController.onInit();
		this.oTableStub.fireEvent("updateFinished");

		// Assert
		assert.strictEqual(this.oSearchController.getModel("searchView").getData().tableBusyDelay, iOriginalBusyDelay,
			"The original busy delay was restored");
	});

	QUnit.module("Search Criteria Tests", {
		beforeEach: function() {
			this.oSearchController = new SearchController();
		}
	});

	QUnit.test("Country should be an exact search criteria", function(assert) {

		var oFilterOperator = this.oSearchController._deriveFilterOperator("country", "*anything*");

		assert.strictEqual(oFilterOperator, sap.ui.model.FilterOperator.EQ);
	});
	
	QUnit.test("Region should be an exact search criteria", function(assert) {
		var oFilterOperator = this.oSearchController._deriveFilterOperator("region", "*anything*");

		assert.strictEqual(oFilterOperator, sap.ui.model.FilterOperator.EQ);		
	});
	
	QUnit.test("Other fields should use Starts with when passed format '*Something'", function(assert) {
		var oFilterOperator = this.oSearchController._deriveFilterOperator("anything", "*something");
		
		assert.strictEqual(oFilterOperator, sap.ui.model.FilterOperator.sWith);
	});
	
	QUnit.test("Other fields should use Ends with when passed format 'Something*'", function(assert) {
		var oFilterOperator = this.oSearchController._deriveFilterOperator("anything", "something*");
		
		assert.strictEqual(oFilterOperator, sap.ui.model.FilterOperator.StartsWith);
	});
	
	QUnit.test("Other fields should use Contains with when passed format '*Something*'", function(assert) {
		var oFilterOperator = this.oSearchController._deriveFilterOperator("anything", "*something*");
		
		assert.strictEqual(oFilterOperator, sap.ui.model.FilterOperator.Contains);
	});
	
	QUnit.test("Other fields should use Contains when passed string with no wildcards", function(assert) {
		var oFilterOperator = this.oSearchController._deriveFilterOperator("anything", "something");
		
		assert.strictEqual(oFilterOperator, sap.ui.model.FilterOperator.Contains);
	});

});