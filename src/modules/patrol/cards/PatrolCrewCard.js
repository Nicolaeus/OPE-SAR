/**
 * ============================================================
 * OPE-SAR
 * PatrolCrewCard
 * ------------------------------------------------------------
 * Gestion de l'équipage de la patrouille.
 * ============================================================
 */

import BaseCard from '../../../shared/ui/cards/BaseCard.js';
import BaseCardController from '../../../shared/ui/cards/BaseCardController.js';
import CardSection from '../../../shared/ui/cards/CardSection.js';

import PatrolService from '../services/PatrolService.js';
import { CREW_ROLES } from '../data/CrewRoles.js';

export default class PatrolCrewCard extends BaseCardController {

    /* ======================================================
     * Ouverture
     * ====================================================== */

    static create() {

        this.close();

        const card =
            new BaseCard({

                id: 'patrol-crew-card',

                title: 'ÉQUIPAGE',

                icon: '👥',

                color: 'blue'

            });

        card.add(
            this.buildMandatoryCrewSection().element
        );

        card.add(
            this.buildAdditionalCrewSection().element
        );

        card.add(
            this.buildAddMemberSection().element
        );

        card.render(
            document.getElementById('app')
        );

        this.instance =
            card;

        card.element.addEventListener(

            'card:close',

            () => PatrolCrewCard.close()

        );

        this.bindEvents();

        this.refresh();

        return card;

    }

    /* ======================================================
     * Composition minimale
     * ====================================================== */

    static buildMandatoryCrewSection() {

        const section =
            new CardSection(
                'Composition minimale'
            );

        const patrol =
            PatrolService.getCurrent();

        const crew =
            patrol?.crew ?? [];

        const container =
            document.createElement(
                'div'
            );

        container.innerHTML = `

            ${this.buildMandatoryMember(
                crew[0],
                0,
                'Patron'
            )}

            ${this.buildMandatoryMember(
                crew[1],
                1,
                'Équipier n°1'
            )}

            ${this.buildMandatoryMember(
                crew[2],
                2,
                'Équipier n°2'
            )}

        `;

        section.add(
            container
        );

        return section;

    }

    /* ======================================================
     * Membre obligatoire
     * ====================================================== */

    static buildMandatoryMember(
        member,
        index,
        title
    ) {

        member ??= {

            lastname: '',

            firstname: ''

        };

        return `

            <div class="opsar-member-block">

                <h4>

                    ${title}

                </h4>

                <div class="opsar-form-row">

                    <div class="opsar-form-group">

                        <label>

                            Nom

                        </label>

                        <input

                            id="crew-${index}-lastname"

                            class="opsar-input"

                            type="text"

                            value="${member.lastname ?? ''}"

                        >

                    </div>

                    <div class="opsar-form-group">

                        <label>

                            Prénom

                        </label>

                        <input

                            id="crew-${index}-firstname"

                            class="opsar-input"

                            type="text"

                            value="${member.firstname ?? ''}"

                        >

                    </div>

                </div>

            </div>

        `;

    }
        /* ======================================================
     * Equipage complémentaire
     * ====================================================== */

    static buildAdditionalCrewSection() {

        const section =
            new CardSection(
                'Équipage complémentaire'
            );

        const patrol =
            PatrolService.getCurrent();

        const crew =
            (patrol?.crew ?? [])
                .filter(member => !member.mandatory);

        const container =
            document.createElement(
                'div'
            );

        if (crew.length === 0) {

            container.innerHTML = `

                <div class="opsar-info">

                    Aucun membre supplémentaire.

                </div>

            `;

        }
        else {

            container.innerHTML =
                crew
                    .map(member =>
                        this.buildCrewRow(member)
                    )
                    .join('');

        }

        section.add(
            container
        );

        return section;

    }

    /* ======================================================
     * Ligne équipage
     * ====================================================== */

    static buildCrewRow(member) {

        const role =
            CREW_ROLES.find(
                r => r.id === member.role
            );

        return `

            <div
                class="opsar-crew-row"
                data-id="${member.id}">

                <div class="opsar-crew-role">

                    ${role?.label ?? member.role}

                </div>

                <div class="opsar-crew-name">

                    ${member.lastname.toUpperCase()}
                    ${member.firstname}

                </div>

                <button

                    class="opsar-btn opsar-btn-danger crew-delete"

                    data-id="${member.id}">

                    🗑

                </button>

            </div>

        `;

    }

    /* ======================================================
     * Ajout d'un membre
     * ====================================================== */

    static buildAddMemberSection() {

        const section =
            new CardSection(
                'Ajouter un membre'
            );

        const container =
            document.createElement(
                'div'
            );

        container.innerHTML = `

            <div class="opsar-form-group">

                <label>

                    Fonction

                </label>

                <select

                    id="crew-role"

                    class="opsar-input">

                    ${this.renderRoleOptions()}

                </select>

            </div>

            <div class="opsar-form-row">

                <div class="opsar-form-group">

                    <label>

                        Nom

                    </label>

                    <input

                        id="crew-lastname"

                        class="opsar-input"

                        type="text">

                </div>

                <div class="opsar-form-group">

                    <label>

                        Prénom

                    </label>

                    <input

                        id="crew-firstname"

                        class="opsar-input"

                        type="text">

                </div>

            </div>

            <button

                id="crew-add"

                class="opsar-btn opsar-btn-primary"

                style="width:100%;">

                ➕ Ajouter le membre

            </button>

        `;

        section.add(
            container
        );

        return section;

    }

    /* ======================================================
     * Fonctions disponibles
     * ====================================================== */

    static renderRoleOptions() {

        return CREW_ROLES

            .filter(role => !role.mandatory)

            .map(role => `

                <option value="${role.id}">

                    ${role.label}

                </option>

            `)

            .join('');

    }
        /* ======================================================
     * Evènements
     * ====================================================== */

    static bindEvents() {

        window.addEventListener(
            'patrol:updated',
            () => this.refresh()
        );

        /* ----------------------------------------------
         * Equipage obligatoire
         * ---------------------------------------------- */

        for (let i = 0; i < 3; i++) {

            document
                .getElementById(
                    `crew-${i}-lastname`
                )
                ?.addEventListener(
                    'change',
                    () => this.saveMandatoryCrew(i)
                );

            document
                .getElementById(
                    `crew-${i}-firstname`
                )
                ?.addEventListener(
                    'change',
                    () => this.saveMandatoryCrew(i)
                );

        }

        /* ----------------------------------------------
         * Ajout
         * ---------------------------------------------- */

        document
            .getElementById(
                'crew-add'
            )
            ?.addEventListener(
                'click',
                () => this.addCrewMember()
            );

        /* ----------------------------------------------
         * Suppression
         * ---------------------------------------------- */

        document
            .querySelectorAll(
                '.crew-delete'
            )
            .forEach(button => {

                button.addEventListener(

                    'click',

                    event =>

                        this.removeCrewMember(
                            event.currentTarget.dataset.id
                        )

                );

            });

    }

    /* ======================================================
     * Rafraîchissement
     * ====================================================== */

    static refresh() {

        if (!this.instance) {
            return;
        }

        this.close();

        this.create();

    }

    /* ======================================================
     * Sauvegarde équipage obligatoire
     * ====================================================== */

    static saveMandatoryCrew(index) {

        PatrolService.updateCrewMember(

            index,

            {

                lastname:

                    document
                        .getElementById(
                            `crew-${index}-lastname`
                        )
                        .value
                        .trim(),

                firstname:

                    document
                        .getElementById(
                            `crew-${index}-firstname`
                        )
                        .value
                        .trim()

            }

        );

    }

    /* ======================================================
     * Ajout d'un membre
     * ====================================================== */

    static addCrewMember() {

        const lastname =
            document
                .getElementById(
                    'crew-lastname'
                )
                .value
                .trim();

        const firstname =
            document
                .getElementById(
                    'crew-firstname'
                )
                .value
                .trim();

        if (
            lastname === '' ||
            firstname === ''
        ) {

            return;

        }

        PatrolService.addCrewMember({

            role:

                document
                    .getElementById(
                        'crew-role'
                    )
                    .value,

            lastname,

            firstname

        });

        document.getElementById(
            'crew-lastname'
        ).value = '';

        document.getElementById(
            'crew-firstname'
        ).value = '';

    }

    /* ======================================================
     * Suppression
     * ====================================================== */

    static removeCrewMember(id) {

        PatrolService.removeCrewMember(
            id
        );

    }

}
