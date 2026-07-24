class ViewportManager {

    static init() {

        const update = () => {

            document.documentElement.style.setProperty(
                '--app-height',
                `${window.visualViewport.height}px`
            );

        };

        update();

        window.visualViewport?.addEventListener(
            'resize',
            update
        );

    }

}
