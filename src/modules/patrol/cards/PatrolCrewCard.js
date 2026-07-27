/**
 * ============================================================
 * OPE-SAR
 * PatrolCrewCard
 * ------------------------------------------------------------
 * Gestion de l'équipage de la patrouille.
 * ============================================================
 */

import BaseCard from '../../../core/ui/BaseCard.js';
import BaseCardController from '../../../core/ui/BaseCardController.js';
import CardSection from '../../../core/ui/CardSection.js';

import PatrolService from '../services/PatrolService.js';
import CREW_ROLES from '../data/CrewRoles.js';

export default class PatrolCrewCard
{
    static CARD_ID = 'patrol-crew-card';

    /**
     * --------------------------------------------------------
     * Ouverture
     * --------------------------------------------------------
     */
    static create()
    {
        const existing = document.getElementById(this.CARD_ID);

        if (existing)
        {
            existing.remove();
        }

        const patrol = PatrolService.getCurrentPatrol();

        const card = new BaseCard({

            id: this.CARD_ID,

            title: '👥 Équipage',

            icon: '👥',

            width: 760,

            closable: true

        });

        card.setContent(this.render(patrol));

        document.body.appendChild(card.element);

        this.bindEvents(card.element);
    }

    /**
     * --------------------------------------------------------
     * Rendu principal
     * --------------------------------------------------------
     */
    static render(patrol)
    {
        return `

            ${this.renderMinimalCrew()}

            ${CardSection.separator()}

            ${this.renderAddMember()}

            ${CardSection.separator()}

            ${this.renderCrewList(patrol)}

        `;
    }

    /**
     * --------------------------------------------------------
     * Composition minimale
     * --------------------------------------------------------
     */
    static renderMinimalCrew()
    {
        return `

            <div class="opsar-section-title">

                Composition minimale

            </div>

            ${this.renderMinimalMember(
                'Patron',
                'captain'
            )}

            ${this.renderMinimalMember(
                'Équipier n°1',
                'deck1'
            )}

            ${this.renderMinimalMember(
                'Équipier n°2',
                'deck2'
            )}

        `;
    }

    /**
     * --------------------------------------------------------
     * Ligne membre minimal
     * --------------------------------------------------------
     */
    static renderMinimalMember(label, id)
    {
        return `

            <div class="opsar-member-block">

                <div class="opsar-member-label">

                    ${label}

                </div>

                <div class="opsar-form-row">

                    <div class="opsar-form-group">

                        <label>Nom</label>

                        <input
                            id="${id}-lastname"
                            class="opsar-input"
                            type="text">

                    </div>

                    <div class="opsar-form-group">

                        <label>Prénom</label>

                        <input
                            id="${id}-firstname"
                            class="opsar-input"
                            type="text">

                    </div>

                </div>

            </div>

        `;
    }

    /**
     * --------------------------------------------------------
     * Ajout d'un membre
     * --------------------------------------------------------
     */
    static renderAddMember()
    {
        return `

            <div class="opsar-section-title">

                Ajouter un membre

            </div>

            <div class="opsar-form-group">

                <label>Fonction</label>

                <select
                    id="crew-role"
                    class="opsar-select">

                    ${this.renderRoleOptions()}

                </select>

            </div>

            <div class="opsar-form-row">

                <div class="opsar-form-group">

                    <label>Nom</label>

                    <input
                        id="crew-lastname"
                        class="opsar-input"
                        type="text">

                </div>

                <div class="opsar-form-group">

                    <label>Prénom</label>

                    <input
                        id="crew-firstname"
                        class="opsar-input"
                        type="text">

                </div>

            </div>

            <div class="opsar-button-row">

                <button
                    id="crew-add"
                    class="opsar-button-primary">

                    ➕ Ajouter

                </button>

            </div>

        `;
    }

    /**
     * --------------------------------------------------------
     * Liste des fonctions
     * --------------------------------------------------------
     */
    static renderRoleOptions()
    {
        return CREW_ROLES
            .map(role => `
                <option value="${role.id}">
                    ${role.label}
                </option>
            `)
            .join('');
    }
      /**
     * --------------------------------------------------------
     * Equipage actuel
     * --------------------------------------------------------
     */
    static renderCrewList(patrol)
    {
        const crew = patrol?.crew ?? [];

        return `

            <div class="opsar-section-title">

                Équipage actuel

            </div>

            <div
                id="crew-list"
                class="opsar-crew-list">

                ${
                    crew.length === 0
                        ? `
                            <div class="opsar-empty">

                                Aucun membre supplémentaire.

                            </div>
                        `
                        : crew.map(member => this.renderCrewMember(member)).join('')
                }

            </div>

        `;
    }

    /**
     * --------------------------------------------------------
     * Ligne membre
     * --------------------------------------------------------
     */
    static renderCrewMember(member)
    {
        const role = CREW_ROLES.find(r => r.id === member.role);

        return `

            <div class="opsar-crew-row">

                <div class="opsar-crew-role">

                    ${role?.label ?? member.role}

                </div>

                <div class="opsar-crew-name">

                    ${member.firstname} ${member.lastname.toUpperCase()}

                </div>

                <button
                    class="opsar-icon-button crew-delete"
                    data-id="${member.id}">

                    🗑️

                </button>

            </div>

        `;
    }

    /**
     * --------------------------------------------------------
     * Evènements
     * --------------------------------------------------------
     */
    static bindEvents(card)
    {
        card
            .querySelector('#crew-add')
            .addEventListener(
                'click',
                () => this.addCrewMember()
            );

        card
            .querySelectorAll('.crew-delete')
            .forEach(button =>
            {
                button.addEventListener(
                    'click',
                    event =>
                    {
                        this.deleteCrewMember(
                            event.currentTarget.dataset.id
                        );
                    }
                );
            });

        [
            'captain',
            'deck1',
            'deck2'
        ].forEach(prefix =>
        {
            card
                .querySelector(`#${prefix}-lastname`)
                .addEventListener(
                    'change',
                    () => this.saveMinimalCrew()
                );

            card
                .querySelector(`#${prefix}-firstname`)
                .addEventListener(
                    'change',
                    () => this.saveMinimalCrew()
                );
        });
    }

    /**
     * --------------------------------------------------------
     * Sauvegarde équipage minimal
     * --------------------------------------------------------
     */
    static saveMinimalCrew()
    {
        PatrolService.updateMinimalCrew({

            captain:
            {
                lastname:
                    document.getElementById('captain-lastname').value,

                firstname:
                    document.getElementById('captain-firstname').value
            },

            deck1:
            {
                lastname:
                    document.getElementById('deck1-lastname').value,

                firstname:
                    document.getElementById('deck1-firstname').value
            },

            deck2:
            {
                lastname:
                    document.getElementById('deck2-lastname').value,

                firstname:
                    document.getElementById('deck2-firstname').value
            }

        });
    }
      /**
     * --------------------------------------------------------
     * Ajout d'un membre
     * --------------------------------------------------------
     */
    static addCrewMember()
    {
        const role =
            document.getElementById('crew-role').value;

        const lastname =
            document.getElementById('crew-lastname').value.trim();

        const firstname =
            document.getElementById('crew-firstname').value.trim();

        if (!lastname || !firstname)
        {
            return;
        }

        PatrolService.addCrewMember({

            id: crypto.randomUUID(),

            role,

            lastname,

            firstname

        });

        document.getElementById('crew-lastname').value = '';
        document.getElementById('crew-firstname').value = '';

        this.refresh();
    }

    /**
     * --------------------------------------------------------
     * Suppression
     * --------------------------------------------------------
     */
    static deleteCrewMember(id)
    {
        PatrolService.removeCrewMember(id);

        this.refresh();
    }

    /**
     * --------------------------------------------------------
     * Rafraîchissement
     * --------------------------------------------------------
     */
    static refresh()
    {
        const card = document.getElementById(this.CARD_ID);

        if (!card)
        {
            return;
        }

        card.remove();

        this.create();
    }

}
