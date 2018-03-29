/* global fluid, floe */

(function ($, fluid) {

    "use strict";

    fluid.defaults("floe.zotero", {
        gradeNames: ["fluid.component"],
        zoteroConfig: {
            baseUrl: "https://api.zotero.org/groups/2086760/items/",
            limit: 50
        },
        components: {
            zoteroItemsMetadata: {
                type: "floe.zotero.zoteroItemsMetadata",
                options: {
                    listeners: {
                        "onCreate.retrieveMetadata": {
                            funcName: "floe.zotero.zoteroItemsMetadata.retrieveMetadata",
                            args: ["{zotero}.options.zoteroConfig", "{that}"]
                        }
                    }
                }
            },
            zoteroItemsLoader: {
                type: "fluid.resourceLoader",
                createOnEvent: "{zoteroItemsMetadata}.events.totalResultsRetrieved",
                options: {
                    gradeNames: ["{that}.generateLoaderGrade"],
                    invokers: {
                        generateLoaderGrade: {
                            funcName: "floe.zotero.generateLoaderGrade",
                            args: ["{zoteroItemsMetadata}.totalResults", "{zotero}.options.zoteroConfig"]
                        }
                    }
                }
            },
            zoteroItemsParser: {
                type: "floe.zotero.zoteroItemsParser",
                createOnEvent: "{zoteroItemsMetadata}.events.totalResultsRetrieved",
                options: {
                    listeners: {
                        "{zoteroItemsLoader}.events.onResourcesLoaded": {
                            funcName: "floe.zotero.zoteroItemsParser.parse",
                            args: ["{zoteroItemsLoader}.resources", "{zoteroItemsHolder}.applier", "zoteroItems"]
                        }
                    }
                }
            },
            zoteroItemsHolder: {
                type: "fluid.modelComponent",
                options: {
                    model: {
                        zoteroItems: null
                    },
                    modelListeners: {
                        "zoteroItems": {
                            "this": "console",
                            method: "log",
                            args: "{that}.model.zoteroItems"
                        }
                    }
                }
            },
            zoteroItemsPresenter: {
                type: "fluid.component"
            }
        }

    });


    floe.zotero.generateLoaderGrade = function (totalResults, zoteroConfig) {

        var gradeName = "floe.zotero.loaderGrade-" + fluid.allocateGuid();

        var limit = zoteroConfig.limit;

        var totalPages = Math.ceil(totalResults / limit);

        var resourceDefs = {
        };

        for (var i = 1; i <= totalPages; i++) {
            var start = (i * limit) - limit;
            var key = "zoteroItems-" + i;
            var url = fluid.stringTemplate(zoteroConfig.baseUrl + "?format=json&sort=title&limit=%limit&start=%start", {start: start, limit: limit});
            resourceDefs[key] = url;
        }

        fluid.defaults(gradeName, {
            gradeName: ["fluid.component"],
            resources: resourceDefs
        });

        return gradeName;
    };

    fluid.defaults("floe.zotero.zoteroItemsMetadata", {
        gradeNames: ["fluid.component"],
        members: {
            totalResults: null
        },
        events: {
            totalResultsRetrieved: null
        }
    });

    floe.zotero.zoteroItemsMetadata.retrieveMetadata = function (zoteroConfig, zoteroItemsMetadata) {
        var url = zoteroConfig.baseUrl + "?limit=1&format=json&sort=title";

        $.ajax({
            url: url
        })
        .done(function (data, textStatus, jqXHR) {
            var totalResults = jqXHR.getResponseHeader("Total-Results");
            zoteroItemsMetadata.totalResults = totalResults;
            zoteroItemsMetadata.events.totalResultsRetrieved.fire();
        });
    };

    fluid.defaults("floe.zotero.zoteroItemsParser", {
        gradeNames: ["fluid.component"]
    });

    floe.zotero.zoteroItemsParser.parse = function (zoteroItemResources, holderApplier, holderEndpoint) {
        var zoteroItems = [];

        fluid.each(zoteroItemResources, function (zoteroItemResource) {

            var parsedResource = JSON.parse(zoteroItemResource.resourceText);

            zoteroItems = zoteroItems.concat(parsedResource);
        });

        holderApplier.change(holderEndpoint, zoteroItems);

    };

})(jQuery, fluid);

// TODO: deal with large item sizes
