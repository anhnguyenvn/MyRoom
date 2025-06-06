import * as React from "react";
import type { Observable } from "@babylonjs/core/Misc/observable";
import type { PropertyChangedEvent } from "../../../propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "../../../tabs/propertyGrids/gui/commonControlPropertyGridComponent";
import type { LockObject } from "../../../tabs/propertyGrids/lockObject";
import type { StackPanel } from "@babylonjs/gui/2D/controls/stackPanel";
import { LineContainerComponent } from "../../../lines/lineContainerComponent";
import { CheckBoxLineComponent } from "../../../lines/checkBoxLineComponent";

interface IStackPanelPropertyGridComponentProps {
    stackPanel: StackPanel;
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class StackPanelPropertyGridComponent extends React.Component<IStackPanelPropertyGridComponentProps> {
    constructor(props: IStackPanelPropertyGridComponentProps) {
        super(props);
    }

    render() {
        const stackPanel = this.props.stackPanel;

        return (
            <>
                <CommonControlPropertyGridComponent lockObject={this.props.lockObject} control={stackPanel} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <LineContainerComponent title="STACKPANEL">
                    <CheckBoxLineComponent
                        label="Clip children"
                        target={stackPanel}
                        propertyName="clipChildren"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <CheckBoxLineComponent label="Vertical" target={stackPanel} propertyName="isVertical" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
            </>
        );
    }
}
