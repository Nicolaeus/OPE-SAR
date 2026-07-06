export default class BottomNavigation {

    static create() {

        const nav =
            document.createElement('nav');

        nav.className =
            'opsar-bottom-nav';

        nav.innerHTML = `

            <button
                class="opsar-nav-btn active"
                data-module="map">

                🗺
                <span>Carte</span>

            </button>

            <button
                class="opsar-nav-btn"
                data-module="stations">

                ⚓
                <span>Stations</span>

            </button>

            <button
                class="opsar-nav-btn"
                data-module="weather">

                🌦
                <span>Météo</span>

            </button>
			
			<button
				class="opsar-nav-btn"
				data-module="tides">

				🌊

				<span>
					Marées
				</span>

			</button>

            <button
                class="opsar-nav-btn"
                data-module="ais">

                📡
                <span>AIS</span>

            </button>

            <button
                class="opsar-nav-btn"
                data-module="sar">

                🚨
                <span>SAR</span>

            </button>
			
			<button
                class="opsar-nav-btn"
                data-module="osc">

                🎯
                <span>OSC</span>

            </button>

            <button
                class="opsar-nav-btn"
                data-module="settings">

                ⚙
                <span>Config</span>

            </button>

        `;

        nav
            .querySelectorAll(
                '.opsar-nav-btn'
            )
            .forEach(button => {

                button.addEventListener(
					'click',
					() => {

						this.activate(
							button
						);

					}
				);

            });

        return nav;

    }

    static activate(button) {

    const alreadyActive =
        button.classList.contains(
            'active'
        );

    document
        .querySelectorAll(
            '.opsar-nav-btn'
        )
        .forEach(btn => {

            btn.classList.remove(
                'active'
            );

        });

    if (!alreadyActive) {

        button.classList.add(
            'active'
        );

    }

    const module =
        button.dataset.module;

    window.dispatchEvent(

        new CustomEvent(

            'navigation:change',

            {
                detail: {
                    module,
                    active:
                        !alreadyActive
                }
            }

        )

    );

}

}