import {
    Table,
    Column,
    Model,
    DataType
} from "sequelize-typescript"
import { ShotAssignedAttributes } from "../types/types"
import { ShotStatus } from "../../globals/types"

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
        type: DataType.ENUM(ShotStatus.created, ShotStatus.assigned, ShotStatus.submitted, ShotStatus.completed)
    })
    declare status: string

    @Column({
        type: DataType.UUID
    })
    declare assignedBy: string

}


export default ShotAssigned