/**
 * Preload a set of templates to compile and cache them for
 * fast access during rendering
 */
export const preloadHandlebarsTemplates = async function () {
    const templatePaths = [
        // Sheet partials
        'systems/FATE_MechanicianHomeBrew/templates/partials/sheet-id.html',
        'systems/FATE_MechanicianHomeBrew/templates/partials/sheet-aspects.html',
        'systems/FATE_MechanicianHomeBrew/templates/partials/sheet-biography.html',
        'systems/FATE_MechanicianHomeBrew/templates/partials/sheet-stunts.html',
        'systems/FATE_MechanicianHomeBrew/templates/partials/sheet-refresh.html',
        'systems/FATE_MechanicianHomeBrew/templates/partials/sheet-skills-grid.html',
        'systems/FATE_MechanicianHomeBrew/templates/partials/sheet-skills-list.html',
        'systems/FATE_MechanicianHomeBrew/templates/partials/sheet-extras.html',
        // Item partials
        'systems/FATE_MechanicianHomeBrew/templates/items/skill-data.html',
        'systems/FATE_MechanicianHomeBrew/templates/items/extra-data.html',
    ];
    // Load the template partials
    return loadTemplates(templatePaths);
};
