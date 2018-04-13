/* global fluid, floe */

(function ($, fluid) {

    "use strict";

    fluid.defaults("floe.zotero.zoteroItems.displayDemo", {
        gradeNames: ["floe.zotero.zoteroItems"],
        resourceContainerSelector: ".resource-container-all",
        resourceContext: null,
        components: {
            zoteroItemsHolder: {
                options: {
                    listeners: {
                        "onHolderReady.renderItems": {
                            funcName: "floe.zotero.zoteroItems.displayDemo.renderItems",
                            args: ["{that}", "{displayDemo}.options.resourceContainerSelector", "{displayDemo}.options.resourceContext"]
                        }
                    }
                }
            }
        }
    });

    floe.zotero.zoteroItems.displayDemo.renderItems = function (zoteroItemsHolder, resourceContainerSelector, resourceContext) {
        var container = $(resourceContainerSelector);

        var notes = zoteroItemsHolder.model.zoteroItemNotes;

        fluid.each(zoteroItemsHolder.model.zoteroItems, function (zoteroItem) {
            var template = "<h3>%title - <a href='%url'>%url</a> </h3><p>%description</p>";

            // default description
            var description = zoteroItem.data.abstractNote;

            // check for resource-context specific one
            if (resourceContext) {
                var resourceContextDescription = fluid.get(notes, [zoteroItem.data.key, "contextNotes", resourceContext]);
                description = resourceContextDescription ? resourceContextDescription : description;
            }

            var rendered = fluid.stringTemplate(template, {
                title: zoteroItem.data.title,
                description: description,
                url: zoteroItem.data.url
            });

            container.append(rendered);
        });
    };

})(jQuery, fluid);
