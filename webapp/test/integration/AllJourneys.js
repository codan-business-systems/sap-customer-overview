jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

sap.ui.require([
		"sap/ui/test/Opa5",
		"zcustoview/test/integration/pages/Common",
		"sap/ui/test/opaQunit",
		"zcustoview/test/integration/pages/Worklist",
		"zcustoview/test/integration/pages/Object",
		"zcustoview/test/integration/pages/NotFound",
		"zcustoview/test/integration/pages/Browser",
		"zcustoview/test/integration/pages/App"
	], function (Opa5, Common) {
	"use strict";
	Opa5.extendConfig({
		arrangements: new Common(),
		viewNamespace: "zcustoview.view."
	});

	sap.ui.require([
		"zcustoview/test/integration/WorklistJourney",
		"zcustoview/test/integration/ObjectJourney",
		"zcustoview/test/integration/NavigationJourney",
		"zcustoview/test/integration/NotFoundJourney"
	], function () {
		QUnit.start();
	});
});
