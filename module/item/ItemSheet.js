import { FATE } from "../config.js";
export class ItemSheetFATE extends ItemSheet {
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.classes = options.classes.concat(['fate', 'item']);
        options.width = 500;
        options.height = 400;
        options.resizable = false;
        options.submitOnChange = true;
        options.tabs = [
            {
                navSelector: '.tabs',
                contentSelector: '.sheet-body',
                initial: 'description',
            },
        ];
        return options;
    }
    get template() {
        return 'systems/fate/templates/item-sheet.html';
    }
    getData() {
        const data = super.getData();
        data.type = this.item.type.toLowerCase();
        data.hasDetails = ['skill', 'extra'].includes(data.type);
        data.dataTemplate = () => `systems/fate/templates/items/${data.type}-data.html`;
        data.isCore = data.data.sheet === 'Core';
        data.isCondensed = data.data.sheet === 'Condensed';
        if (data.type === 'skill')
            this._getLevel(data);
        return data;
    }
    _getLevel(data) {
        const level = Object.entries(FATE.fateLadder).find((value) => value[1] === data.data.level);
        const label = game.i18n.localize(`FATE.Ladder.${level[0]}`);
        const value = level[1] >= 0 ? '+' + level[1] : level[1];
        data.level = `${label} (${value})`;
    }
    activateListeners(html) {
        super.activateListeners(html);
    }
}
