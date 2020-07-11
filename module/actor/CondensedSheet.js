import { ActorSheetFate } from "./BaseSheet.js";
export class CondensedCharacterSheet extends ActorSheetFate {
    static get defaultOptions() {
        const options = super.defaultOptions;
        mergeObject(options, {
            classes: options.classes.concat([
                'fate',
                'condensed',
                'character-sheet',
            ]),
            width: 650,
            height: 760,
            resizable: false,
        });
        return options;
    }
    get template() {
        return 'systems/FATE_MechanicianHomeBrew/templates/condensed-sheet.html';
    }
}
