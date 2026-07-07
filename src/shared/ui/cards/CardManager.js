export default class CardManager {

    static cards = [];

    static register(card) {

        this.cards.push(card);

    }

    static get(id) {

        return this.cards.find(
            c => c.id === id
        );

    }

}