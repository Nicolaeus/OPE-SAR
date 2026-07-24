/**
 * ==========================================================
 * OPE-SAR
 * Viewport Manager
 * ==========================================================
 *
 * Gère les dimensions réelles du viewport sur desktop,
 * Android et iOS (Safari / PWA).
 *
 * Met à disposition les variables CSS :
 *
 * --viewport-width
 * --viewport-height
 *
 * ==========================================================
 */

export default class ViewportManager {

    static init() {

        const update = () => {

            const viewport = window.visualViewport;

            const width =
                viewport?.width ??
                window.innerWidth;

            const height =
                viewport?.height ??
                window.innerHeight;

            document.documentElement.style.setProperty(
                "--viewport-width",
                `${width}px`
            );

            document.documentElement.style.setProperty(
                "--viewport-height",
                `${height}px`
            );

            console.table({
            
                screenHeight: screen.height,
            
                innerHeight: window.innerHeight,
            
                outerHeight: window.outerHeight,
            
                visualHeight: window.visualViewport?.height,
            
                visualTop: window.visualViewport?.offsetTop,
            
                visualBottom:
                    window.visualViewport
                        ? window.visualViewport.offsetTop +
                          window.visualViewport.height
                        : null
            
            });

            console.log("📱 Viewport", {
                width,
                height,
                innerWidth: window.innerWidth,
                innerHeight: window.innerHeight,
                visualViewport: viewport
                    ? {
                        width: viewport.width,
                        height: viewport.height,
                        offsetTop: viewport.offsetTop,
                        offsetLeft: viewport.offsetLeft
                    }
                    : null
            });

        };

        update();

        window.addEventListener(
            "resize",
            update
        );

        window.addEventListener(
            "orientationchange",
            update
        );

        window.visualViewport?.addEventListener(
            "resize",
            update
        );

        window.visualViewport?.addEventListener(
            "scroll",
            update
        );

    }

    
    
}
