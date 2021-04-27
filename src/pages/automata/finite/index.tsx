// Import Dependencies
import { Button, PageHeader, Upload } from "antd";
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
import { useModal } from "@/components/TwoMachineSelectModal";
import {
    fromDBEntry,
    union,
    toDBEntry,
    intersect,
} from "@/lib/automaton/Machine";
import { v4 as uuid } from "uuid";
// Define Style
const UnionSymbol = styled.div`
    ::after {
        content: "∪";
    }
    text-align: center;
    font-size: 3rem;
`;
const IntersectionSymbol = styled.div`
    ::after {
        content: "∩";
    }
    text-align: center;
    font-size: 4rem;
    font-weight: bold;
`;
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
    const loadMachineFromDB = async () => {
        const db = await useDatabase();
        const machines = await db.getAll(FLWarriorDBTables.MACHINE);
        setMachineList(machines);
    };
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
    const unionOfMachines = async (machineA, machineB) => {
        // Fetch Machines from Database
        const db = await useDatabase();
        const serialMachine1 = await db.get(
            FLWarriorDBTables.MACHINE,
            machineA
        );
        const serialMachine2 = await db.get(
            FLWarriorDBTables.MACHINE,
            machineB
        );
        // Transform Into Objects
        const machine1 = fromDBEntry(serialMachine1);
        const machine2 = fromDBEntry(serialMachine2);
        // Make Union
        const unionMachine = union(machine1, machine2, true, uuid());
        // Save Union Into DB
        const serializedUnionMachine = toDBEntry(unionMachine);
        await db.add(FLWarriorDBTables.MACHINE, serializedUnionMachine);
        // Edit new machine
        editMachine(serializedUnionMachine.id);
    };
    const intersectionOfMachines = async (machineA, machineB) => {
        // Fetch Machines from Database
        const db = await useDatabase();
        const serialMachine1 = await db.get(
            FLWarriorDBTables.MACHINE,
            machineA
        );
        const serialMachine2 = await db.get(
            FLWarriorDBTables.MACHINE,
            machineB
        );
        // Transform Into Objects
        const machine1 = fromDBEntry(serialMachine1);
        const machine2 = fromDBEntry(serialMachine2);
        // Make Intersect
        const intersectMachine = intersect(machine1, machine2, true);
        // Save Intersect Into DB
        const serializedIntersectMachine = toDBEntry(intersectMachine);
        await db.add(FLWarriorDBTables.MACHINE, serializedIntersectMachine);
        // Edit new machine
        editMachine(serializedIntersectMachine.id);
    };
    const importMachine = async (importedFile: File) => {
        // Get File Content
        const fileContent = await importedFile.text();
        // Parse as Object
        const machineDB: MachineDBEntry = JSON.parse(fileContent);
        // Add Machine to database
        const db = await useDatabase();
        await db.add(FLWarriorDBTables.MACHINE, machineDB);
        await loadMachineFromDB();
    };
    // Fetch Data
    useAsyncEffect(loadMachineFromDB, []);
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
    // Setup Modals
    const [showModalUnion, modalUnion] = useModal({
        title: "Unir Máquinas",
        onSubmit: ([m1, m2]) => unionOfMachines(m1, m2),
        submitText: "Adicionar",
        machineList: machineList.map((m) => ({ id: m.id, name: m.name })),
        operationSymbol: <UnionSymbol />,
        submitDisabled: ([m1, m2]) => !m1 || !m2 || m1 === m2,
    });
    const [showModalIntersection, modalIntersection] = useModal({
        title: "Interseccionar Máquinas",
        onSubmit: ([m1, m2]) => intersectionOfMachines(m1, m2),
        submitText: "Adicionar",
        machineList: machineList.map((m) => ({ id: m.id, name: m.name })),
        operationSymbol: <IntersectionSymbol />,
        submitDisabled: ([m1, m2]) => !m1 || !m2 || m1 === m2,
    });
    // Define Page
    return (
        <>
            <Layout>
                <MachinesList>
                    <PageHeader
                        onBack={history.goBack}
                        title="Automatos Finitos"
                        subTitle="Listagem"
                        extra={[
                            <Button key="button-union" onClick={showModalUnion}>
                                Unir Autômatos
                            </Button>,
                            <Button
                                key="button-intersect"
                                onClick={showModalIntersection}
                            >
                                Interseccionar Autômatos
                            </Button>,

                            <Button
                                type="primary"
                                key="button-create"
                                onClick={createMachine}
                            >
                                Criar Autômato
                            </Button>,
                            <Upload
                                key="button-import"
                                showUploadList={false}
                                accept="application/json"
                                beforeUpload={() => false}
                                onChange={(changeEvent) =>
                                    importMachine(
                                        (changeEvent.file as unknown) as File
                                    )
                                }
                            >
                                <Button type="dashed">Importar</Button>
                            </Upload>,
                        ]}
                    />
                    {modalUnion}
                    {modalIntersection}
                    <RegisteredItemsList dataSource={machineListDataSource} />
                </MachinesList>
            </Layout>
        </>
    );
}
