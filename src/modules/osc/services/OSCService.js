import OSCMission from '../models/OSCMission.js';
import OSCAsset from '../models/OSCAsset.js';
import SARService from '../../sar/services/SARService.js';

export default class OSCService {

    static currentMission = null;

    static createMission(data = {}) {

        this.currentMission =
            new OSCMission(data);
		
		this.currentMission.timeline = [];

        return this.currentMission;

    }

    static getMission() {

        return this.currentMission;

    }

    static addAsset(data = {}) {

        if (!this.currentMission) {
            return null;
        }

        const asset =
            new OSCAsset(data);

        this.currentMission.assets.push(
            asset
        );
		
		this.currentMission.timeline.unshift({

			timestamp:
				new Date(),

			author:
				'OSC',

			message:
				`${asset.name} engagé`

		});

        return asset;

    }

    static removeAsset(assetId) {

        if (!this.currentMission) {
            return;
        }

        this.currentMission.assets =
            this.currentMission.assets.filter(
                asset =>
                    asset.id !== assetId
            );

    }

    static assignAsset(
        assetId,
        task
    ) {

        if (!this.currentMission) {
            return;
        }

        const asset =
            this.currentMission.assets.find(
                a => a.id === assetId
            );

        if (!asset) {
            return;
        }

        asset.assignment =
            task;

        asset.status =
            'assigned';

    }

    static updateAssetPosition(
        assetId,
        position
    ) {

        if (!this.currentMission) {
            return;
        }

        const asset =
            this.currentMission.assets.find(
                a => a.id === assetId
            );

        if (!asset) {
            return;
        }

        asset.position =
            position;

    }

    static reset() {

        this.currentMission =
            null;

    }

}