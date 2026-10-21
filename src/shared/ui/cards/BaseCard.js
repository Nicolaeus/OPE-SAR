export default class BaseCard {

    // Keep every card above the app header and options, but below the footer.
    static zIndex = 3000;
    static maxZIndex = 3999;

    static nextZIndex() {
        BaseCard.zIndex = Math.min(BaseCard.zIndex + 1, BaseCard.maxZIndex);
        return BaseCard.zIndex;
    }

    constructor(config = {}) {

        this.id =
            config.id ||
            crypto.randomUUID();

        this.title =
            config.title ||
            'Card';
			
		this.color =
			config.color ||
			'purple';

		this.icon =
			config.icon ||
			'';

        this.collapsed = false;

        this.element =
            this.create();

    }

    create() {

        const card =
            document.createElement('div');

        card.className =
		`opsar-card opsar-card-${this.color}`;

        card.id =
            this.id;

        this.bringToFront(
            card
        );

        card.style.position =
            'absolute';

        card.style.top =
            '140px';

        card.style.right =
            '20px';

        card.innerHTML = `

            <div class="opsar-card-header">

                <div class="opsar-card-title">

					<span class="opsar-card-icon">

						${this.icon}

					</span>

					<span>

						${this.title}

					</span>

				</div>
				
                <div class="opsar-card-actions">

                    <button
                        class="opsar-card-collapse">

                        −

                    </button>

                    <button
                        class="opsar-card-close">

                        ×

                    </button>

                </div>

            </div>

            <div
                class="opsar-card-body">

            </div>

        `;

        const collapseBtn =
            card.querySelector(
                '.opsar-card-collapse'
            );

        collapseBtn.addEventListener(
            'click',
            () => {
                this.bringToFront();
                this.toggle();
            }
        );
        collapseBtn.setAttribute('type', 'button');
        collapseBtn.setAttribute('aria-label', 'Réduire la fenêtre');
        collapseBtn.setAttribute('aria-expanded', 'true');

        const closeBtn =
            card.querySelector(
                '.opsar-card-close'
            );

        closeBtn.addEventListener(
			'click',
			() => {

				card.dispatchEvent(

					new CustomEvent(

						'card:close',

						{
							bubbles: true
						}

					)

				);

			}
		);

        card.addEventListener(
            'pointerdown',
            () => this.bringToFront(),
            {
                passive: true
            }
        );

        this.makeDraggable(
            card
        );

        return card;

    }

    makeDraggable(card) {

        const header =
            card.querySelector(
                '.opsar-card-header'
            );

        let dragging = false;

        let offsetX = 0;

        let offsetY = 0;

        header.addEventListener(
            'mousedown',
            event => {

                dragging = true;

                this.bringToFront(
                    card
                );

                offsetX =
                    event.clientX -
                    card.offsetLeft;

                offsetY =
                    event.clientY -
                    card.offsetTop;

            }
        );

        document.addEventListener(
            'mousemove',
            event => {

                if (!dragging) {
                    return;
                }

                card.style.left =
                    (
                        event.clientX -
                        offsetX
                    ) + 'px';

                card.style.top =
                    (
                        event.clientY -
                        offsetY
                    ) + 'px';

                card.style.right =
                    'auto';

            }
        );

        document.addEventListener(
            'mouseup',
            () => {

                dragging = false;

            }
        );

    }

    getBody() {

        return this.element.querySelector(
            '.opsar-card-body'
        );

    }

    add(content) {

        this.getBody().appendChild(
            content
        );

    }

    toggle() {

        const body =
            this.getBody();

        this.collapsed =
            !this.collapsed;

        this.element.classList.toggle(
            'opsar-card-collapsed',
            this.collapsed
        );

        body.style.display =
            this.collapsed
                ? 'none'
                : 'block';

        const collapseButton =
            this.element.querySelector('.opsar-card-collapse');

        collapseButton.textContent = this.collapsed ? '+' : '−';
        collapseButton.setAttribute('aria-expanded', String(!this.collapsed));
        collapseButton.setAttribute(
            'aria-label',
            this.collapsed ? 'Agrandir la fenêtre' : 'Réduire la fenêtre'
        );

    }

    render(parent) {

        parent.appendChild(
            this.element
        );

        this.bringToFront();

    }

    bringToFront(card = this.element) {

        if (!card) {
            return;
        }

        card.style.zIndex =
            BaseCard.nextZIndex();

    }

}
