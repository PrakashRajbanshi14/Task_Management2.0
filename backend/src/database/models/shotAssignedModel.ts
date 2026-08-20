import {
    Table,
    Column,
    Model,
    DataType
} from "sequelize-typescript"
import { ShotAssignedAttributes } from "../types/types"

interface ShotAssignedCreationAttributes
    extends Omit<ShotAssignedAttributes, "id"> {

    id?: string
}


@Table({
    tableName: "shot_assigned",
    modelName: "ShotAssigned",
    timestamps: true
})


class ShotAssigned
    extends Model<
        ShotAssignedAttributes,
        ShotAssignedCreationAttributes
    > {


    @Column({
        primaryKey: true,
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4
    })
    declare id: string


    @Column({
        type: DataType.UUID
    })
    declare shotId: string


    @Column({
        type: DataType.UUID
    })
    declare employeeId: string


    @Column({
        type: DataType.UUID
    })
    declare assignedBy: string


    @Column({
        type: DataType.DATE
    })
    declare assignedAt: Date
}


export default ShotAssigned