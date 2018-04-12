/* global fluid, floe, jqUnit */

(function ($, fluid) {

    "use strict";

    // Create the test grade
    // 1. Override the metadata invoker
    // 2. Retrieve the sample JSON file

    fluid.defaults("floe.zotero.zoteroItemsTest", {
        gradeNames: ["floe.zotero.zoteroItems"],
        zoteroConfig: {
            baseUrl: "../json/rawItems.json"
        },
        components: {
            zoteroItemsMetadata: {
                options: {
                    invokers: {
                        retrieveMetadata: {
                            funcName: "floe.zotero.zoteroItemsTest.retrieveMetadata",
                            args: ["{zoteroItems}.options.zoteroConfig", "{that}"]
                        }
                    }
                }
            }
        }
    });

    // Sets total results from the number of items in the file, for
    // testing purposes
    floe.zotero.zoteroItemsTest.retrieveMetadata = function (zoteroConfig, zoteroItemsMetadata) {
        var url = zoteroConfig.baseUrl + "?limit=1&format=json&sort=title";

        $.ajax({
            url: url
        })
        .done(function (data) {
            var itemsAsArray = fluid.hashToArray(data);
            var totalResults = itemsAsArray.length;
            zoteroItemsMetadata.totalResults = totalResults;
            zoteroItemsMetadata.events.totalResultsRetrieved.fire();
        });
    };

    // Basic IoC test structure

    fluid.defaults("floe.test.zoteroItemsTester", {
        gradeNames: ["fluid.test.testCaseHolder"],
        modules: [{
            name: "Test the floe.zotero.zoteroItems component.",
            tests: [{
                expect: 4,
                name: "Test zoteroItems component",
                sequence: [
                    {
                        listener: "jqUnit.assert",
                        "event": "{zoteroItemsTest zoteroItems zoteroItemsMetadata}.events.totalResultsRetrieved",
                        args: ["totalResultsRetrieved event fired"]
                    }, {
                        listener: "floe.test.zoteroItemsTester.testGenerateLoaderGrade",
                        "event": "{zoteroItemsTest zoteroItems zoteroItemsLoader}.events.onCreate",
                        args: ["{zoteroItems}.zoteroItemsLoader"]
                    }, {
                        changeEvent: "{zoteroItems}.zoteroItemsHolder.applier.modelChanged",
                        "path": "zoteroItems",
                        listener: "floe.test.zoteroItemsTester.testHolderModelPoint",
                        args: ["{zoteroItems}.zoteroItemsHolder", "zoteroItems", "{zoteroItemsTest}.zoteroItemsTestData.options.resources.parsedItems.resourceText"]
                    }, {
                        changeEvent: "{zoteroItems}.zoteroItemsHolder.applier.modelChanged",
                        "path": "zoteroItemNotes",
                        listener: "floe.test.zoteroItemsTester.testHolderModelPoint",
                        args: ["{zoteroItems}.zoteroItemsHolder", "zoteroItemNotes", "{zoteroItemsTest}.zoteroItemsTestData.options.resources.notes.resourceText"]
                    }]
            }]
        }]
    });

    floe.test.zoteroItemsTester.testGenerateLoaderGrade = function (zoteroItemsLoader) {
        var resources = zoteroItemsLoader.options.resources;
        var expectedResources = {
            "zoteroItems-1": "../json/rawItems.json?format=json&sort=title&limit=50&start=0"
        };
        jqUnit.assertDeepEq("Resources options are the ones expected to be generated for the loader grade", expectedResources, resources);
    };

    floe.test.zoteroItemsTester.testHolderModelPoint = function (zoteroItemsHolder, modelPath, expectedContent) {
        jqUnit.assertDeepEq("Parsed resources are as expected (notes have been removed)", JSON.parse(expectedContent), zoteroItemsHolder.model[modelPath]);
    };

    fluid.defaults("floe.test.zoteroItemsTest", {
        gradeNames: ["fluid.test.testEnvironment"],
        components: {
            zoteroItems: {
                type: "floe.zotero.zoteroItemsTest",
                createOnEvent: "{zoteroItemsTester}.events.onTestCaseStart"
            },
            zoteroItemsTester: {
                type: "floe.test.zoteroItemsTester"
            },
            // Holder for JSON files loaded as resources
            zoteroItemsTestData: {
                type: "fluid.component",
                options: {
                    // Necessary because otherwise a JSON object .resourcetext
                    // may get interpreted as an IoC reference
                    mergePolicy: {
                        "resources": "noexpand"
                    },
                    resources: null
                }
            }
        }
    });

    fluid.defaults("floe.test.zoteroItemsTestDataLoader", {
        gradeNames: ["fluid.resourceLoader"],
        resources: {
            rawItems: "../json/rawItems.json",
            parsedItems: "../json/parsedItems.json",
            notes: "../json/notes.json"
        },
        listeners: {
            "onResourcesLoaded.runTests": {
                funcName: "floe.test.zoteroItemsTestDataLoader.runTest",
                args: ["{that}.resources"]
            }
        }
    });

    floe.test.zoteroItemsTestDataLoader.runTest = function (resources) {
        floe.test.zoteroItemsTest({
            components: {
                zoteroItemsTestData: {
                    options: {
                        resources: resources
                    }
                }
            }
        });
    };

    floe.test.zoteroItemsTestDataLoader();


})(jQuery, fluid);
