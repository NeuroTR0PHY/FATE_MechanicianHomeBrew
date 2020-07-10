/**
 * Preload a set of templates to compile and cache them for
 * fast access during rendering
 */
export const preloadHandlebarsTemplates = async function () {
    const templatePaths = [
        // Sheet partials
        'systems/fate/templates/partials/sheet-id.html',
        'systems/fate/templates/partials/sheet-aspects.html',
        'systems/fate/templates/partials/sheet-biography.html',
        'systems/fate/templates/partials/sheet-stunts.html',
        'systems/fate/templates/partials/sheet-refresh.html',
        'systems/fate/templates/partials/sheet-skills-grid.html',
        'systems/fate/templates/partials/sheet-skills-list.html',
        'systems/fate/templates/partials/sheet-extras.html',
        // Item partials
        'systems/fate/templates/items/skill-data.html',
        'systems/fate/templates/items/extra-data.html',
    ];
    // Load the template partials
    return loadTemplates(templatePaths);
};
