// Import Dependencies
import { Button, PageHeader } from "antd";
import { useMemo, useState } from "react";
import { useHistory } from "react-router-dom";
import RegisteredItemsListRaw from "@components/RegisteredItemsList";
import Layout from "@layout";
import styled from "styled-components";
import IconBase from "@ant-design/icons";
import { ReactComponent as Graph } from "@assets/graph.svg";
import { useDatabase } from "@database";
import { FLWarriorDBTables } from "@database/schema";
import useAsyncEffect from "@/utils/useAsyncEffect";
import { saveAs } from "file-saver";
import {
    MachineDBEntry,
    getNewMachine,
    MachineType,
} from "@database/schema/machine";
// Define Style
const MachinesList = styled.section`
    height: 100%;
    display: flex;
    flex-direction: column;
`;
const RegisteredItemsList = styled(RegisteredItemsListRaw)`
    /* Full Panel Size */
    flex-grow: 1;
    margin-bottom: 1rem;

    /* Align center */
    width: calc(100% - 48px);
    margin: 1.5rem auto;

    /* Pagination on End */
    display: flex;
    flex-direction: column;
    justify-content: space-between;
`;
const GraphAvatar = styled(IconBase).attrs({ component: Graph })`
    font-size: 2em;
`;
// Define Component
export default function FiniteAutomata(): JSX.Element {
    // Setup State
    const [machineList, setMachineList] = useState<Array<MachineDBEntry>>([]);
    // Fetch Context
    const history = useHistory();
    // Define Handlers
    const editMachine = (itemId: string) => {
        // Go to editing page
        history.push(`/automata/finite/edit/${itemId}`);
    };
    const createMachine = async () => {
        // Instantiate Basic Machine
        const newMachine = getNewMachine(MachineType.FINITE_STATE_MACHINE);
        // Add Machine to database
        const db = await useDatabase();
        await db.add(FLWarriorDBTables.MACHINE, newMachine);
        // Edit new machine
        editMachine(newMachine.id);
    };
    const deleteMachine = async (itemId: string) => {
        // Remove Machine from Database
        const db = await useDatabase();
        db.delete(FLWarriorDBTables.MACHINE, itemId);
        // Remove Machine from Machine List
        setMachineList(machineList.filter((machine) => machine.id !== itemId));
    };
    const exportMachine = async (itemId: string) => {
        // Fetch Machine from Database
        const db = await useDatabase();
        const machine = await db.get(FLWarriorDBTables.MACHINE, itemId);
        // Save as File
        const serializedMachine = JSON.stringify(machine);
        const machineFile = new File(
            [serializedMachine],
            `${machine.type}-${machine.id}.json`,
            { type: "application/json;charset=utf-8" }
        );
        saveAs(machineFile);
    };
    // Fetch Data
    useAsyncEffect(async () => {
        const db = await useDatabase();
        const machines = await db.getAll(FLWarriorDBTables.MACHINE);
        setMachineList(machines);
    }, []);
    const machineListDataSource = useMemo(
        () =>
            machineList.map((machine) => ({
                id: machine.id,
                name: machine.name,
                avatar: <GraphAvatar />,
                onEdit: editMachine,
                onDelete: deleteMachine,
                onExport: exportMachine,
            })),
        [machineList]
    );
    // Fetch Data
    return (
        <>
            <Layout>
                <MachinesList>
                    <PageHeader
                        onBack={history.goBack}
                        title="Automatos Finitos"
                        subTitle="Listagem"
                        extra={[
                            <Button
                                type="primary"
                                key="button-create"
                                onClick={createMachine}
                            >
                                Criar Autômato
                            </Button>,
                        ]}
                    />
                    <RegisteredItemsList dataSource={machineListDataSource} />
                </MachinesList>
            </Layout>
        </>
    );
}
