export default class CardToggle {

    constructor(config) {

        const wrapper =
            document.createElement('label');

        wrapper.className =
            'opsar-toggle';

        wrapper.innerHTML = `

			<span>
				${config.label}
			</span>

			<input
				type="checkbox"
				${config.checked ? 'checked' : ''}
			>

		`;

        const input =
            wrapper.querySelector('input');

        input.addEventListener(
            'change',
            event => {

                config.onChange?.(
                    event.target.checked
                );

            }
        );

        this.element = wrapper;

    }

}