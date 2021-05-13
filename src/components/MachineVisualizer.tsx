// Import Dependencies
import cy from "cytoscape";
import dagre from "cytoscape-dagre";
import styled from "styled-components";
import { Modal } from "antd";
import { useEffect, useRef, useState } from "react";
import { IIMachine, IMachine } from "@/lib/automaton/Machine";
import type { FunctionComponent, ReactNode } from "react";
// Define Layout for Cytoscape
cy.use(dagre);
// Define Styles
const GraphViewport = styled.section`
    // Sizing
    height: 70vh;
    // Borders
    border-radius: 16px;
    border-color: rgba(100, 100, 100, 0.3);
    border-width: 2px;
    border-style: solid;
`;
// Define Component
interface IMachineVisualizerProps {
    machine: IIMachine;
}
const MachineVisualizer: FunctionComponent<IMachineVisualizerProps> = ({
    machine,
}) => {
    // Define Refs
    const canvas = useRef<HTMLDivElement>();
    // Define Machine
    useEffect(() => {
        if (!machine) {
            return;
        }
        // Fetch States
        const states = (machine?.get("states") as IMachine["states"])
            .valueSeq()
            .toArray();
        const transitions = (machine?.get(
            "transitions"
        ) as IMachine["transitions"])
            .valueSeq()
            .toArray();
        // Create Visualization
        cy({
            // Define where it will be mounted
            container: canvas.current,
            // Define Layout (Import Dagre)
            layout: ({
                name: "dagre",
                padding: 100,
                spacingFactor: 1.3,
            } as unknown) as cy.LayoutOptions,
            // Define Style
            style: [
                {
                    selector: "node",
                    style: {
                        "background-color": "#DDD",
                        "border-color": "#000",
                        "border-style": "solid",
                        "border-width": "2px",
                        label: "data(id)",
                        "text-valign": "center",
                        "text-halign": "center",
                    },
                },
                {
                    selector: `node[id="__ghost__"]`,
                    style: {
                        "background-opacity": 0,
                        "border-opacity": 0,
                        label: "",
                    },
                },
                {
                    selector: "edge",
                    style: {
                        width: 2,
                        "target-arrow-shape": "triangle",
                        "line-color": "#000",
                        "target-arrow-color": "#000",
                        "curve-style": "bezier",
                        label: "data(label)",
                        "text-valign": "top",
                        "text-halign": "left",
                        "text-background-color": "#FFF",
                        "text-background-opacity": 0.99,
                        "text-background-shape": "roundrectangle",
                        "text-background-padding": "0.05em",
                        "text-border-color": "#CCC",
                        "text-border-style": "solid",
                        "text-border-opacity": 0.5,
                        "text-border-width": 1,
                        "z-index": 0,
                    },
                },
                {
                    selector: `edge[source="__ghost__"]`,
                    style: {
                        width: 3,
                        label: "",
                        "target-arrow-shape": "triangle-tee",
                    },
                },
                {
                    selector: `node[isExit="true"]`,
                    style: {
                        "border-style": "double",
                        "border-width": "4px",
                    },
                },
            ],
            // Define Interface Elements
            elements: {
                nodes: [
                    {
                        data: { id: "__ghost__", isExit: false },
                    },
                    ...states.map((state) => ({
                        data: {
                            id: state.get("id") as string,
                            isExit: `${state.get("isExit")}`,
                        },
                    })),
                ],
                edges: [
                    {
                        data: {
                            source: "__ghost__",
                            target: states
                                .find((s) => s.get("isEntry"))
                                .get("id") as string,
                        },
                    },
                    ...transitions.map((transition) => ({
                        data: {
                            label: transition.get("with"),
                            source: transition.get("from"),
                            target: transition.get("to"),
                        },
                    })),
                ],
            },
        });
    }, [machine]);
    // Define Render Function
    return (
        <>
            <GraphViewport id="machine-view" ref={canvas} />
        </>
    );
};
// Define Modal Wrapper
export interface IHookMachineVisualizerProps {
    machine: IIMachine;
}

export interface IHookMachineVisualizer {
    (props: IHookMachineVisualizerProps): [
        showModal: VoidFunction,
        wrapper: ReactNode
    ];
}
export const useMachineVisualizer: IHookMachineVisualizer = ({ machine }) => {
    // Define States
    const [visible, setVisible] = useState(false);
    // Define Handlers
    // Define Show Functions
    const showModal = () => setVisible(true);
    const onDispose = () => setVisible(false);
    // Define Modal Wrapper
    const wrapper = (
        <Modal
            title="Visualizar Máquina"
            footer={null}
            visible={visible}
            onCancel={onDispose}
            width="50vw"
        >
            <MachineVisualizer machine={machine} />
        </Modal>
    );
    // Return Modal
    return [showModal, wrapper];
};
// Export Component
export default MachineVisualizer;
