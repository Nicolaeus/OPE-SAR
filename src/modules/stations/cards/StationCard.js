import BaseCard from '../../../shared/ui/cards/BaseCard.js';
import CardSection from '../../../shared/ui/cards/CardSection.js';
import StationReferenceService from '../services/StationReferenceService.js';
import BaseCardController from '../../../shared/ui/cards/BaseCardController.js';

export default class StationCard extends BaseCardController{

    static create(station) {

   if (this.instance) {

        this.instance.element.remove();

    }

    if (!station) {

        const card = new BaseCard({

            id: 'station-card',

            title: 'Stations',

            color: 'cyan',

            icon: '⚓'

        });

        const section =

            new CardSection('Aucune station');

        section.add(document.createTextNode(

            'Sélectionnez une station sur la carte.'

        ));

        card.add(section.element);

        card.render(document.getElementById('app'));

        this.instance = card;

        return card;

    }

    // ... le reste de ton code actuel

        // =================================
        // IDENTITÉ
        // =================================

        const identity =
            new CardSection(
                'Identité'
            );

        const identityContent =
            document.createElement('div');

        identityContent.innerHTML = `

            <div>Station : ${station.name}</div>

            <div>Dept. : ${station.department ?? '-'}</div>

            <div>Région : ${station.region ?? '-'}</div>

            <div>Ville : ${station.city ?? '-'}</div>

        `;

        identity.add(
            identityContent
        );

        // =================================
        // OPÉRATIONNEL
        // =================================

        const operational =
            new CardSection(
                'Opérationnel'
            );

        const operationalContent =
            document.createElement('div');

        operationalContent.innerHTML = `

            <div>
                CROSS :
                ${station.operational?.cross ?? '-'}
            </div>

            <div>
                SRR :
                ${station.operational?.srr ?? '-'}
            </div>

            <div>
                Zone :
                ${station.operational?.zone ?? '-'}
            </div>

        `;

        operational.add(
            operationalContent
        );

        // =================================
        // MOYENS
        // =================================

        const assets =
            new CardSection(
                'Moyens'
            );

        const assetsContent =
            document.createElement('div');

        const boats =
            station.assets?.boats || [];

        if (boats.length === 0) {

            assetsContent.innerHTML =
                '<div>Aucun moyen renseigné</div>';

        }
        else {

            boats.forEach(
                boat => {

                    const row =
                        document.createElement(
                            'div'
                        );

                    row.innerHTML = `

                        ${boat.registration}
                        (${boat.class})

                    `;

                    assetsContent.appendChild(
                        row
                    );

                }
            );

        }

        assets.add(
            assetsContent
        );

        // =================================
        // CONTACTS
        // =================================

        const contacts =
            new CardSection(
                'Contacts'
            );

        const contactsContent =
            document.createElement('div');

        contactsContent.innerHTML = `

            <div>
                📞
                ${station.phone ?? '-'}
            </div>

            <div>
                ✉
                ${station.email ?? '-'}
            </div>

        `;

        contacts.add(
            contactsContent
        );

		// =================================
		// ACTIONS
		// =================================

		const actions =
			document.createElement('div');

		actions.className =
			'station-actions';

		const referenceButton =
			document.createElement('button');

		referenceButton.className =
			'opsar-btn-primary';

		referenceButton.textContent =
			'Définir comme station de référence';

		referenceButton.addEventListener(
			'click',
			() => {

				StationReferenceService.save(
					station.id
				);

				console.log(
					'⚓ Station de référence enregistrée :',
					station.name
				);

			}
		);

		actions.appendChild(
			referenceButton
		);

        // =================================
        // ASSEMBLAGE
        // =================================

        card.add(
            identity.element
        );

        card.add(
            operational.element
        );

        card.add(
            assets.element
        );

        card.add(
            contacts.element
        );
		
		card.add(
            actions
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

			() => {

				StationCard.close();

			}

		);

        return card;

    }

}