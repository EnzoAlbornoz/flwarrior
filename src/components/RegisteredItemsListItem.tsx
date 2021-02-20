// Import Dependencies
import type { FunctionComponent, ReactNode } from "react";
import { Button, List } from "antd";
import { EditFilled, DeleteFilled, DownloadOutlined } from "@ant-design/icons";
// Define Types
export interface IRegisteredItemsListItemProps {
    id: string;
    name: string;
    avatar?: ReactNode;
    onEdit: (itemId: string) => void;
    onDelete: (itemId: string) => void;
    onExport: (itemId: string) => void;
}
// Define Component
const RegisteredItemsListItem: FunctionComponent<IRegisteredItemsListItemProps> = ({
    name,
    avatar,
    id,
    onDelete,
    onEdit,
    onExport,
}) => {
    return (
        <>
            <List.Item
                actions={[
                    <Button
                        type="primary"
                        icon={<EditFilled />}
                        key="button-edit"
                        onClick={() => onEdit(id)}
                    >
                        Edit
                    </Button>,
                    <Button
                        danger
                        icon={<DeleteFilled />}
                        key="button-delete"
                        onClick={() => onDelete(id)}
                    >
                        Delete
                    </Button>,
                    <Button
                        type="dashed"
                        icon={<DownloadOutlined />}
                        key="button-export"
                        onClick={() => onExport(id)}
                    >
                        Export
                    </Button>,
                ]}
            >
                <List.Item.Meta avatar={avatar} title={name} />
            </List.Item>
        </>
    );
};
// Export Component
export default RegisteredItemsListItem;
