import { ActorSheetFate } from './BaseSheet.js';
import { FATE } from '../config.js';
export class FAECharacterSheet extends ActorSheetFate {
    static get defaultOptions() {
        const options = super.defaultOptions;
        mergeObject(options, {
            classes: options.classes.concat([
                'fate',
                'accelerated',
                'character-sheet',
            ]),
            width: 650,
            height: 760,
            resizable: false,
        });
        return options;
    }
    get template() {
        return 'systems/fate/templates/fae-sheet.html';
    }
    getData() {
        const sheetData = super.getData();
        sheetData.approaches = {};
        sheetData.cons = {};
        for (const [a, appr] of Object.entries(sheetData.data.approaches)) {
            sheetData.approaches[a] = appr;
            sheetData.approaches[a].label = CONFIG.FATE.approaches[a];
        }
        for (const [a, con] of Object.entries(sheetData.data.health.cons)) {
            sheetData.cons[a] = con;
            sheetData.cons[a].label = CONFIG.FATE.consequences[a];
            sheetData.cons[a].stress = CONFIG.FATE.consequenceStress[a];
        }
        const fateLadder = {};
        for (const [level, value] of Object.entries(FATE.fateLadder)) {
            fateLadder[level] = {
                label: game.i18n.localize(`FATE.Ladder.${level}`),
                value,
            };
        }
        sheetData.fateLadder = fateLadder;
        sheetData.stress = sheetData.data.health.stress;
        return sheetData;
    }
    activateListeners(html) {
        super.activateListeners(html);
        html.find('.approach-item .property-label').on('click', (ev) => {
            ev.preventDefault();
            const approach = $(ev.currentTarget).text();
            this.rollApproach(approach);
        });
    }
    rollApproach(approach) {
        const value = this.actor.data.data.approaches[approach.toLowerCase()]
            .value;
        const level = Object.entries(FATE.fateLadder).find((l) => l[1] === value);
        const levelLabel = game.i18n.localize(`FATE.Ladder.${level[0]}`);
        const levelValue = level[1] >= 0 ? '+' + level[1] : level[1];
        const levelText = `${levelLabel} (${levelValue})`;
        const _roll = (action, bonus = 0) => {
            const rollMode = game.settings.get('core', 'rollMode');
            let r = new Roll(`4dF + ${value}`);
            let flavor = `<h2>${action}</h2>` + `<p><b>${levelText} ${approach}</b></p>`;
            if (bonus > 0) {
                r = new Roll(`4dF + ${value} + ${bonus}`);
                flavor =
                    `<h2>${action}</h2>` +
                        `<p><b>${levelLabel} (${levelValue}) ${approach} + ${bonus}</b></p>`;
            }
            r.roll().toMessage({
                speaker: ChatMessage.getSpeaker(),
                flavor,
            });
        };
        const d = new Dialog({
            title: `${approach} Roll`,
            content: `<p class="text">What <b>${approach}</b> action do you want to perform at<br/><b>${levelText}</b>?</p>` +
                `<p class="bonus"><label>Aspect/Stunt Bonus:</label> <input class="property" type="number" name="bonus"/></p>`,
            buttons: {
                overcome: {
                    label: '<i class="fi fi-overcome"></i>Overcome',
                    callback: (el) => {
                        const bonus = Number($(el).find('input[name="bonus"]').val());
                        _roll('Overcome', bonus);
                    },
                },
                advantage: {
                    label: '<i class="fi fi-create"></i>Create an Advantage',
                    callback: (el) => {
                        const bonus = Number($(el).find('input[name="bonus"]').val());
                        _roll('Create an Advantage', bonus);
                    },
                },
                attack: {
                    label: '<i class="fi fi-attack"></i>Attack',
                    callback: (el) => {
                        const bonus = Number($(el).find('input[name="bonus"]').val());
                        _roll('Attack', bonus);
                    },
                },
                defend: {
                    label: '<i class="fi fi-defend"></i>Defend',
                    callback: (el) => {
                        const bonus = Number($(el).find('input[name="bonus"]').val());
                        _roll('Defend', bonus);
                    },
                },
            },
        }, {
            classes: ['dialog', 'skill-dialog'],
            width: 500,
        }).render(true);
    }
}
