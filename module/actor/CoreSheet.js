import { ActorSheetFate } from './BaseSheet.js';
import { FATE } from '../config.js';
export class CoreCharacterSheet extends ActorSheetFate {
    constructor() {
        super(...arguments);
        this.preventClick = false;
    }
    static get defaultOptions() {
        const options = super.defaultOptions;
        mergeObject(options, {
            classes: options.classes.concat([
                'fate',
                'core',
                'character-sheet',
            ]),
            width: 1000,
            height: 642,
            resizable: false,
        });
        return options;
    }
    get template() {
        return 'systems/fate/templates/core-sheet.html';
    }
    getData() {
        const sheetData = super.getData();
        sheetData.cons = {};
        sheetData.physStress = sheetData.data.health.stress.physical;
        sheetData.mentStress = sheetData.data.health.stress.physical;
        for (const [a, con] of Object.entries(sheetData.data.health.cons)) {
            sheetData.cons[a] = con;
            sheetData.cons[a].label = CONFIG.FATE.consequences[a];
            sheetData.cons[a].stress = CONFIG.FATE.consequenceStress[a];
            if (a === 'mild') {
                const physiqueLevel = this._getHighestStressLevel('physical');
                const willLevel = this._getHighestStressLevel('mental');
                const enabled = physiqueLevel >= 5
                    ? 'Physique'
                    : willLevel >= 5
                        ? 'Will'
                        : null;
                sheetData.cons[a].isMild = true;
                sheetData.cons[a].twoEnabled = enabled
                    ? game.i18n.localize(`FATE.Sheet.Cons.${enabled}`)
                    : '';
                // If disabled, empty the Consequence if it was previously set
                if (!enabled && sheetData.cons[a].two) {
                    sheetData.cons[a].two = '';
                    this.actor.data.data.health.cons.mild.two = '';
                    this.actor.update(this.actor.data);
                }
            }
        }
        return sheetData;
    }
    _prepareItems(sheetData) {
        super._prepareItems(sheetData);
        const extras = [];
        const skills = {};
        for (const i of sheetData.items) {
            if (i.type === 'Extra') {
                extras.push(i);
            }
        }
        const skillItems = sheetData.items.filter((i) => i.type === 'Skill');
        for (const [level, value] of Object.entries(FATE.fateLadder)) {
            if (value >= 1 && value <= 5) {
                const filteredSkills = skillItems.filter((sk) => sk.data.level === value);
                while (filteredSkills.length !== 5) {
                    filteredSkills.push(null);
                }
                skills[level] = {
                    label: game.i18n.localize(`FATE.Ladder.${level}`),
                    value,
                    filteredSkills,
                };
            }
        }
        sheetData.extras = extras;
        sheetData.skills = skills;
    }
    _getHighestStressLevel(type) {
        let stressType = 'physical';
        switch (type) {
            case 'physique':
            case 'physical':
                stressType = 'physical';
                break;
            case 'will':
            case 'mental':
                stressType = 'mental';
                break;
        }
        const skills = this.actor.items.filter((i) => i.type === 'Skill' && i.data.data.health[stressType]);
        const highestSkill = skills.length > 0
            ? skills.reduce((prev, cur) => prev.data.data.level > cur.data.data.level ? prev : cur)
            : null;
        return highestSkill ? highestSkill.data.data.level : 0;
    }
    activateListeners(html) {
        super.activateListeners(html);
        html.find('.skill-edit')
            .each((i, box) => {
            box.setAttribute('draggable', 'true');
            box.addEventListener('dragstart', (event) => {
                this._onDragItemStart(event);
            });
        })
            // Click opens roll dialog
            .on('click', (ev) => {
            ev.preventDefault();
            this.timer = setTimeout(() => {
                if (this.preventClick)
                    return (this.preventClick = false);
                const id = $(ev.currentTarget).attr('data-item-id');
                this.rollSkill(id);
            }, 200);
        })
            // Double click opens skill sheet
            .on('dblclick', (ev) => {
            ev.preventDefault();
            clearTimeout(this.timer);
            this.preventClick = true;
            const div = $(ev.currentTarget);
            const skill = this.actor.getOwnedItem(div.attr('data-item-id'));
            if (!skill)
                return;
            skill.sheet.render(true);
        })
            // Right click asks for deletion
            .on('contextmenu', (ev) => {
            ev.preventDefault();
            const div = $(ev.currentTarget);
            const skillId = div.attr('data-item-id');
            const skill = this.actor.getOwnedItem(skillId);
            new Dialog({
                title: `Delete ${skill.name} Skill?`,
                content: `<p>Are you sure you want to delete the <b>${skill.name}</b> skill?</p>`,
                buttons: {
                    yes: {
                        label: '<i class="fas fa-trash"></i>Yes',
                        callback: () => this.actor.deleteOwnedItem(skillId),
                    },
                    no: {
                        label: 'No',
                        callback: () => { },
                    },
                },
                default: 'yes',
            }).render(true);
        });
        html.find('.stress-item').each((i, el) => {
            const box = $(el).find('.stress-box');
            const input = $(el).find('input');
            const value = Number(input.attr('data-value'));
            const type = input.attr('data-stress');
            const level = this._getHighestStressLevel(type);
            if (value > 2 + Math.ceil(level / 2)) {
                el.classList.add('disabled');
                box.addClass('disabled');
                input.attr('disabled', 'disabled');
                input.attr('checked', null);
                // If disabled, uncheck if it was previously checked
                const checked = this.actor.data.data.health.stress[type][value];
                if (checked) {
                    this.actor.data.data.health.stress[type][value] = false;
                    this.actor.update(this.actor.data);
                }
            }
        });
    }
    rollSkill(skillId) {
        const skill = this.actor.getOwnedItem(skillId);
        const level = Object.entries(FATE.fateLadder).find((l) => l[1] === skill.data.data.level);
        const levelLabel = game.i18n.localize(`FATE.Ladder.${level[0]}`);
        const levelValue = level[1] >= 0 ? '+' + level[1] : level[1];
        const levelText = `${levelLabel} (${levelValue})`;
        const _roll = (action, bonus = 0) => {
            const rollMode = game.settings.get('core', 'rollMode');
            let r = new Roll(`4dF + ${skill.data.data.level}`);
            let flavor = `<h2>${action}</h2>` +
                `<p><b>${levelText} ${skill.name}</b></p>`;
            if (bonus > 0) {
                r = new Roll(`4dF + ${skill.data.data.level} + ${bonus}`);
                flavor =
                    `<h2>${action}</h2>` +
                        `<p><b>${levelLabel} (${levelValue}) ${skill.name} + ${bonus}</b></p>`;
            }
            r.roll().toMessage({
                speaker: ChatMessage.getSpeaker(),
                flavor,
            });
        };
        const d = new Dialog({
            title: `${skill.name} Skill Roll`,
            content: `<p class="text">What action do you want to perform with your<br/><b>${levelText} ${skill.name}</b>?</p>` +
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
    /**
     * Overrides method to handle dragging and dropping of
     * skill items
     */
    async _onDrop(event) {
        event.preventDefault();
        let data;
        try {
            data = JSON.parse(event.dataTransfer.getData('text/plain'));
        }
        catch (err) {
            return false;
        }
        const actor = this.actor;
        const level = Number($(event.target).closest('.skills-boxes').attr('data-level'));
        let itemData;
        // Ensure the skill can be added
        if (!this._canAddSkill(level)) {
            ui.notifications.error('You cannot add more than 5 skills to a skill level');
            return false;
        }
        // Case 1 - Dropped from Compendium
        if (data.pack) {
            const pack = game.packs.find((p) => p.collection === data.pack);
            if (pack.metadata.entity !== 'Item')
                return;
            const item = await pack.getEntity(data.id);
            itemData = duplicate(item.data);
        }
        // Case 2 - Dropped from Actor Sheet
        else if (data.data) {
            itemData = duplicate(data.data);
        }
        // Case 3 - Dropped from Items Directory
        else {
            const item = game.items.get(data.id);
            itemData = duplicate(item.data);
        }
        if (itemData.type === 'Skill') {
            let sameActor = data.actorId === actor._id;
            if (sameActor && actor.isToken)
                sameActor = data.tokenId === actor.token.id;
            if (sameActor)
                return this._sortSkill(itemData, level);
            else {
                itemData.data.sheet = 'Core';
                itemData.data.level = level;
                await actor.createOwnedItem(itemData);
                console.log('Fate | Added Skill to Core character sheet');
            }
        }
        else {
            return super._onDrop(event);
        }
        // 	const data = JSON.parse(
        // 		event.dataTransfer.getData('text/plain') || '{}'
        // 	);
        // 	const target = event.target as HTMLElement;
        // 	const item = game.items.get(data.id) as SkillItem;
        // 	const parent = target.closest('.skills-boxes') as HTMLElement;
        // 	if (!parent) return;
        // 	const level = Number(parent.dataset.level);
        // 	if (!this._canAddSkill(level)) {
        // 		ui.notifications.error(
        // 			'You cannot add more than 5 skills to a skill level'
        // 		);
        // 		return;
        // 	}
        // 	// If the dragged item is not found, it's an Owned Item
        // 	if (!item) {
        // 		data.data.level = level;
        // 		this.actor.updateOwnedItem(data);
        // 	}
        // 	// Else the item is a dragged onto the sheet
        // 	else if (item.type === 'Skill') {
        // 		// if (!target.classList.contains('skill-box')) return;
        // 		if (this.actor.items.find((i) => i.name === item.name)) return;
        // 		item.data.data.sheet = 'Core';
        // 		item.data.data.level = level;
        // 		console.log('Fate | Added Skill to Core character');
        // 		return this.actor.createEmbeddedEntity('OwnedItem', item);
        // 	} else {
        // 		return super._onDrop(event);
        // 	}
    }
    /**
     * Checks if it's allowed to add a skill to the desired level
     */
    _canAddSkill(level) {
        let number = 0;
        this.actor.items.forEach((i) => {
            if (i.type === 'Skill') {
                if (i.data.data.level === level) {
                    number++;
                }
            }
        });
        return number < 5;
    }
    /**
     * Sorts an Owned Skill Item within the same Actor Sheet
     */
    _sortSkill(data, level) {
        data.data.level = level;
        this.actor.updateEmbeddedEntity('OwnedItem', data);
    }
}
