export default class CardSection {

    constructor(title) {

        this.element =
            document.createElement('div');

        this.element.className =
            'opsar-card-section';

        this.element.innerHTML = `
            <div class="opsar-section-title">
                ${title}
            </div>
        `;

    }

    add(content) {

        this.element.appendChild(
            content
        );

    }

}