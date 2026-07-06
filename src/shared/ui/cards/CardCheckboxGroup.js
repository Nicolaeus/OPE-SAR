export default class CardCheckboxGroup {

    constructor(config) {

        const wrapper =
            document.createElement('div');

        config.options.forEach(option => {

            const label =
                document.createElement('label');

            label.className =
                'opsar-checkbox';

            label.innerHTML = `

				<span>
					${option.label}
				</span>

				<input
					type="checkbox"
					${option.checked ? 'checked' : ''}
				>

			`;

            label
                .querySelector('input')
                .addEventListener(
                    'change',
                    event => {

                        config.onChange?.(
                            option.value,
                            event.target.checked
                        );

                    }
                );

            wrapper.appendChild(label);

        });

        this.element = wrapper;

    }

}