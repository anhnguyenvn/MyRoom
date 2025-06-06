import * as React from "react";
import type { Observable } from "@babylonjs/core/Misc/observable";
import type { PropertyChangedEvent } from "../../../propertyChangedEvent";
import type { Control } from "@babylonjs/gui/2D/controls/control";
import { CommonControlPropertyGridComponent } from "../../../tabs/propertyGrids/gui/commonControlPropertyGridComponent";
import type { LockObject } from "../../../tabs/propertyGrids/lockObject";

interface IControlPropertyGridComponentProps {
    control: Control;
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class ControlPropertyGridComponent extends React.Component<IControlPropertyGridComponentProps> {
    constructor(props: IControlPropertyGridComponentProps) {
        super(props);
    }

    render() {
        const control = this.props.control;

        return <CommonControlPropertyGridComponent lockObject={this.props.lockObject} control={control} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />;
    }
}
