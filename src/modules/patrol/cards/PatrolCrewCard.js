/**
 * ============================================================
 * OPE-SAR
 * PatrolCrewCard
 * ============================================================
 *
 * Gestion de l'équipage de la patrouille.
 *
 * Cette version V2 ne recrée jamais la carte pendant
 * les rafraîchissements.
 *
 * Le DOM est construit une seule fois.
 *
 * refresh() ne fait que mettre à jour les données.
 *
 * ============================================================
 */

import BaseCard
from '../../../shared/ui/cards/BaseCard.js';

import BaseCardController
from '../../../shared/ui/cards/BaseCardController.js';

import CardSection
from '../../../shared/ui/cards/CardSection.js';

import PatrolService
from '../services/PatrolService.js';

import { CREW_ROLES }
from '../data/CrewRoles.js';

export default class PatrolCrewCard
extends BaseCardController {

    static CARD_ID =
        'patrol-crew-card';

    static initialized =
        false;

    /**
     * =====================================================
     * Création
     * =====================================================
     */

    static create() {

        if (this.instance) {

            this.instance
                .bringToFront?.();

            return this.instance;

        }

        const card =
            new BaseCard({

                id: this.CARD_ID,

                title: 'ÉQUIPAGE',

                icon: '👥',

                color: 'blue'

            });

        card.add(

            this.buildMandatorySection()
                .element

        );

        card.add(

            this.buildAdditionalSection()
                .element

        );

        card.add(

            this.buildAddSection()
                .element

        );

        card.render(

            document.getElementById(
                'app'
            )

        );

        this.instance =
            card;

        card.element.addEventListener(

            'card:close',

            () => this.close()

        );

        this.bindEvents();

        this.refresh();

        return card;

    }

    /**
     * =====================================================
     * Composition minimale
     * =====================================================
     */

    static buildMandatorySection() {

        const section =
            new CardSection(
                'Composition minimale'
            );

        const container =
            document.createElement(
                'div'
            );

        container.id =
            'crew-mandatory-container';

        section.add(
            container
        );

        return section;

    }

    /**
     * =====================================================
     * Equipage complémentaire
     * =====================================================
     */

    static buildAdditionalSection() {

        const section =
            new CardSection(
                'Equipage complémentaire'
            );

        const container =
            document.createElement(
                'div'
            );

        container.id =
            'crew-list';

        section.add(
            container
        );

        return section;

    }

    /**
     * =====================================================
     * Ajout d'un membre
     * =====================================================
     */

    static buildAddSection() {

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

    class="opsar-btn
           opsar-btn-primary"

    style="width:100%;">

➕ Ajouter

</button>

`;

        section.add(
            container
        );

        return section;

    }

    /**
     * =====================================================
     * Fonctions disponibles
     * =====================================================
     */

    static renderRoleOptions() {

        return CREW_ROLES

            .filter(

                role =>

                    role.id !==
                    'captain'

            )

            .map(

                role => `

<option value="${role.id}">

${role.label}

</option>

`

            )

            .join('');

    }

    /**
     * =====================================================
     * Evènements
     * =====================================================
     */

    static bindEvents() {

        if (
            this.initialized
        ) {

            return;

        }

        this.initialized = true;

        document.addEventListener(

            'click',

            event => {

                if (
                    event.target.id ===
                    'crew-add'
                ) {

                    this.addCrewMember();

                    return;

                }

                if (

                    event.target.dataset.removeCrew

                ) {

                    PatrolService.removeCrewMember(

                        event.target.dataset.removeCrew

                    );

                    this.refreshAdditionalCrew();

                }

            }

        );

        document.addEventListener(

            'change',

            event => {

                if (

                    event.target.dataset.mandatory

                ) {

                    this.saveMandatoryCrew();

                }

            }

        );

    }

    /**
     * =====================================================
     * Rafraîchissement global
     * =====================================================
     */

    static refresh() {

        this.refreshMandatoryCrew();

        this.refreshAdditionalCrew();

    }

    /**
     * =====================================================
     * Composition minimale
     * =====================================================
     */

    static refreshMandatoryCrew() {

        const patrol =
            PatrolService.getCurrent();

        const container =
            document.getElementById(
                'crew-mandatory-container'
            );

        if (
            !container ||
            !patrol
        ) {

            return;

        }

        container.innerHTML =
            patrol.crew

                .filter(

                    member =>

                        member.mandatory

                )

                .map(

                    (

                        member,
                        index

                    ) =>

                        this.renderMandatoryMember(

                            member,
                            index

                        )

                )

                .join('');

    }

    /**
     * =====================================================
     * Equipage complémentaire
     * =====================================================
     */

    static refreshAdditionalCrew() {

        const patrol =
            PatrolService.getCurrent();

        const container =
            document.getElementById(
                'crew-list'
            );

        if (

            !container ||
            !patrol

        ) {

            return;

        }

        container.innerHTML =

            patrol.crew

                .filter(

                    member =>

                        !member.mandatory

                )

                .map(

                    member =>

                        this.renderCrewMember(

                            member

                        )

                )

                .join('');

    }

    /**
     * =====================================================
     * Rendu membre obligatoire
     * =====================================================
     */

    static renderMandatoryMember(

        member,

        index

    ) {

        const label =

            CREW_ROLES.find(

                role =>

                    role.id ===
                    member.role

            )?.label ??

            member.role;

        return `

<div class="opsar-form-row">

<div class="opsar-form-group">

<label>

${label}

</label>

<input

type="text"

class="opsar-input"

placeholder="Nom"

value="${member.lastname}"

data-mandatory="${index}"

data-field="lastname">

</div>

<div class="opsar-form-group">

<label>

Prénom

</label>

<input

type="text"

class="opsar-input"

placeholder="Prénom"

value="${member.firstname}"

data-mandatory="${index}"

data-field="firstname">

</div>

</div>

`;

    }

    /**
     * =====================================================
     * Rendu membre complémentaire
     * =====================================================
     */

    static renderCrewMember(member) {

        const label =

            CREW_ROLES.find(

                role =>

                    role.id === member.role

            )?.label ??

            member.role;

        return `

<div class="opsar-card"
     style="margin-bottom:10px;">

<div class="opsar-row">

<strong>

${label}

</strong>

<button

class="opsar-btn
       opsar-btn-danger"

data-remove-crew="${member.id}">

✕
</button>

</div>

<div class="opsar-row">

<span>

${member.lastname}

${member.firstname}

</span>

</div>

</div>

`;

    }

    /**
     * =====================================================
     * Sauvegarde équipage minimal
     * =====================================================
     */

    static saveMandatoryCrew() {

        document

            .querySelectorAll(

                '[data-mandatory]'

            )

            .forEach(

                input => {

                    const index =
                        Number(

                            input.dataset.mandatory

                        );

                    const field =
                        input.dataset.field;

                    PatrolService
                        .updateCrewMember(

                            index,

                            {

                                [field]:
                                    input.value.trim()

                            }

                        );

                }

            );

    }

    /**
     * =====================================================
     * Ajout d'un membre
     * =====================================================
     */

    static addCrewMember() {

        const role =
            document.getElementById(
                'crew-role'
            ).value;

        const lastname =
            document.getElementById(
                'crew-lastname'
            ).value.trim();

        const firstname =
            document.getElementById(
                'crew-firstname'
            ).value.trim();

        if (

            !lastname &&
            !firstname

        ) {

            return;

        }

        PatrolService.addCrewMember({

            role,

            lastname,

            firstname

        });

        document.getElementById(
            'crew-lastname'
        ).value = '';

        document.getElementById(
            'crew-firstname'
        ).value = '';

        document.getElementById(
            'crew-role'
        ).selectedIndex = 0;

        this.refreshAdditionalCrew();

    }

    /**
     * =====================================================
     * Fermeture
     * =====================================================
     */

    static close() {

        super.close();

        this.instance = null;

        this.initialized = false;

    }

}
