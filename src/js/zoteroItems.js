/* global fluid, floe */

(function ($, fluid) {

    "use strict";

    fluid.defaults("floe.zotero.zoteroItems", {
        gradeNames: ["fluid.component"],
        zoteroConfig: {
            // This should be a Zotero API endpoint that returns items,
            // such as this one:
            // baseUrl: "https://api.zotero.org/groups/2086760/items/"
            baseURL: "",
            limit: 50
        },
        components: {
            zoteroItemsMetadata: {
                type: "floe.zotero.zoteroItemsMetadata",
                options: {
                    listeners: {
                        "onCreate.retrieveMetadata": {
                            func: "{that}.retrieveMetadata"
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
                            funcName: "floe.zotero.zoteroItems.generateLoaderGrade",
                            args: ["{zoteroItemsMetadata}.totalResults", "{zoteroItems}.options.zoteroConfig"]
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
                            funcName: "floe.zotero.zoteroItemsParser.parseAndStore",
                            args: ["{zoteroItemsLoader}.resources", "{zoteroItemsHolder}.applier", "{zoteroItemsHolder}.events.onHolderReady", "zoteroItems", "zoteroItemNotes"]
                        }
                    }
                }
            },
            zoteroItemsHolder: {
                type: "fluid.modelComponent",
                options: {
                    events: {
                        onHolderReady: null
                    },
                    model: {
                        zoteroItems: null,
                        zoteroItemNotes: null
                    }
                }
            }
        }

    });

    floe.zotero.zoteroItems.generateLoaderGrade = function (totalResults, zoteroConfig) {

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
        },
        invokers: {
            retrieveMetadata: {
                funcName: "floe.zotero.zoteroItemsMetadata.retrieveMetadata",
                args: ["{zoteroItems}.options.zoteroConfig", "{that}"]
            }
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

    floe.zotero.zoteroItemsParser.parseAndStore = function (zoteroItemResources, holderApplier, readyEvent, itemsEndpoint, notesEndpoint) {
        var zoteroItems = [];

        fluid.each(zoteroItemResources, function (zoteroItemResource) {

            var parsedResource = JSON.parse(zoteroItemResource.resourceText);

            zoteroItems = zoteroItems.concat(parsedResource);
        });

        var notesHolder = [];

        // Remove the note items to a separate array
        fluid.remove_if(zoteroItems, function (zoteroItem) {
            if (zoteroItem.data.itemType === "note") {
                return true;
            }
        }, notesHolder);

        // Construct separate notes object, keyed by parentItem

        var zoteroItemNotes = {};

        fluid.each(notesHolder, function (zoteroItemNote) {
            var parentItemKey = zoteroItemNote.data.parentItem;
            zoteroItemNotes[parentItemKey] = zoteroItemNotes[parentItemKey] ? zoteroItemNotes[parentItemKey] : {"contextNotes": {}, "rawNotes": {}};

            var noteContext = floe.zotero.zoteroItemsParser.getNoteContext(zoteroItemNote.data.note);

            zoteroItemNotes[parentItemKey].contextNotes[noteContext.contextKey] = noteContext.contextNote;

            zoteroItemNotes[parentItemKey].rawNotes[zoteroItemNote.data.key] = zoteroItemNote;
        });

        holderApplier.change(itemsEndpoint, zoteroItems);
        holderApplier.change(notesEndpoint, zoteroItemNotes);
        readyEvent.fire();

    };

    // Extracts the "context" from a note, with the assumption that the note
    // content is formatted like this: "<p>SJRK: This is an SJRK-context note.</p>"
    // Returns the following structure:
    // {
    //  contextKey: "SJRK",
    //  contextNote: "This is an SJRK-context note."
    // }

    floe.zotero.zoteroItemsParser.getNoteContext = function (noteContent) {

        // Remove any HTML around the content
        var noteText = $(noteContent).text();

        var noteContext = {
            contextKey: noteText.split(":")[0].trim(),
            contextNote: noteText.split(":")[1].trim()
        };
        return noteContext;
    };

})(jQuery, fluid);
