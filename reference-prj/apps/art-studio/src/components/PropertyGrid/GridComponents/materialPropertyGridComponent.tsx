import * as React from "react";

import type { Observable } from "@babylonjs/core/Misc/observable";
import type { Material } from "@babylonjs/core/Materials/material";

import type { PropertyChangedEvent } from "client-tools-ui-components/propertyChangedEvent";
import { CommonMaterialPropertyGridComponent } from "./commonMaterialPropertyGridComponent";
import type { LockObject } from "client-tools-ui-components/tabs/propertyGrids/lockObject";
import type { GlobalState } from "../../globalState";

interface IMaterialPropertyGridComponentProps {
    globalState: GlobalState;
    material: Material;
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class MaterialPropertyGridComponent extends React.Component<IMaterialPropertyGridComponentProps> {
    constructor(props: IMaterialPropertyGridComponentProps) {
        super(props);
    }

    render() {
        const material = this.props.material;

        return (
            <CommonMaterialPropertyGridComponent
                globalState={this.props.globalState}
                lockObject={this.props.lockObject}
                material={material}
                onPropertyChangedObservable={this.props.onPropertyChangedObservable}
            />
        );
    }
}
