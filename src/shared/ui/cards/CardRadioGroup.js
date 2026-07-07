export default class CardRadioGroup {

    constructor(config) {

        const wrapper =
            document.createElement('div');

        config.options.forEach(option => {

            const label =
                document.createElement('label');

            label.className =
                'opsar-radio';

            label.innerHTML = `

				<span>
					${option.label}
				</span>

				<input
					type="radio"
					name="${config.name}"
					value="${option.value}"
					${option.checked ? 'checked' : ''}
				>

			`;

            label
                .querySelector('input')
                .addEventListener(
                    'change',
                    () => {

                        config.onChange?.(
                            option.value
                        );

                    }
                );

            wrapper.appendChild(label);

        });

        this.element = wrapper;

    }

}