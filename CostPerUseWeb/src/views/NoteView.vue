<script setup lang="ts">
import { ref, nextTick } from 'vue'
import type { TableInstance } from 'element-plus'
import { MdPreview } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import { marked } from 'marked'
import axios from 'axios'
import type { TableColumnCtx } from 'element-plus'

const tableLayout = ref<TableInstance['tableLayout']>('fixed')

interface TableRow  {
    id: number
    tags: string[]
    content: string
    created_at: string
    updated_at: string
}

interface ListItem {
    value: string
    label: string
}

interface NoteDialogConfig {
    visible: boolean
    content: string
    created_at: string
    id: number
    tags: string[]
    tagOptions: ListItem[]
    loading: boolean
}


const tableData = ref<TableRow[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const totalNotes = ref(0)
const noteDialogConfig = reactive<NoteDialogConfig>({
    visible: false,
    content: '',
    created_at: '',
    id: -1,
    tags: [],
    tagOptions: [],
    loading: false,
})
const tableTagList = ref<ListItem[]>([])
const allTagList = ref<ListItem[]>([])
const apiBase = import.meta.env.VITE_API_BASE


function getTableDataByPage(
    pageNum: number,
    pageSize: number,
    noteFilter: string = '',
    tagFilter: Array<string> = [],
): void {
    console.log('fetching data', pageNum, pageSize, noteFilter, tagFilter)
    axios.post(`${apiBase}/note/getByPage`, {
        "page": pageNum,
        "pageSize": pageSize,
        "noteFilter": noteFilter,
        "tagFilter": tagFilter,
    }).then((res) => {
        console.log("getByPage", res)
        tableData.value = res.data
    }).catch((error) => {
        console.error("getByPage error", error)
    })
}

function getTotalSize(noteFilter: string = '', tagFilter: Array<string> = []) {
    // 请求note总数
        axios.post(`${apiBase}/note/getTotal`, {
            "noteFilter": noteFilter,
            "tagFilter": tagFilter
        }).then((res) => {
            totalNotes.value = res.data
        })
    console.log('fetching total size', noteFilter, tagFilter)
}

function getTagList(noteFilter: string = '', tagFilter: Array<string> = []) {
    // 请求所有Tag列表
    axios.post(`${apiBase}/note/getAllTags`, {
        "noteFilter": noteFilter,
        "tagFilter": tagFilter
    }).then((res) => {
        tableTagList.value = res.data.map((tag: string) => ({
            value: tag.toLowerCase(),
            label: tag.toLowerCase(),
        }))
        if (!noteFilter && !tagFilter.length && !allTagList.value.length) {
            allTagList.value = tableTagList.value
        }
    })
}

onMounted(() => {
    getTableDataByPage(currentPage.value, pageSize.value)
    getTotalSize()
    getTagList()
})

const pageLayout = ref('prev, pager, next, total, sizes, jumper')
const noteSearch = ref('')
const tagSearch = ref([])
const tagOptions = ref<ListItem[]>()
const loading = ref(false)

const handleClose = (done: () => void) => {
  ElMessageBox.confirm('Close without saving?')
    .then(() => {
      done()
    })
    .catch(() => {
      // catch error
    })
}

const handleNoteSearchChange = (note: string) => {
    // 请求后端搜索note
    console.log('Search note:', note)
    getTableDataByPage(currentPage.value, pageSize.value, note, tagSearch.value)
    getTotalSize(note, tagSearch.value)
    getTagList(note, tagSearch.value)
}

const handleTagFilterSelect = (query: string) => {
    console.log(query, tagOptions, tableTagList)
    // 本地页面搜索tag方法
    if (query) {
        loading.value = true
        setTimeout(() => {
            loading.value = false
            tagOptions.value = tableTagList.value.filter((item) => {
                return item.label.toLowerCase().includes(query.toLowerCase())
            })
        }, 200)
    } else {
        tagOptions.value = tableTagList.value
    }
}


const handleNewNoteTagSearch = (query: string) => {
    // new note dialog本地搜索tag方法
    if (query) {
        noteDialogConfig.loading = true
        noteDialogConfig.loading = false
        noteDialogConfig.tagOptions = allTagList.value.filter((item) => {
            return item.label.toLowerCase().includes(query.toLowerCase())
        })
    } else {
        noteDialogConfig.tagOptions = allTagList.value
    }
}

const handleTagSearchChange = (value: string[]) => {
    // 请求后端搜索tag
    console.log('Selected tags:', value)
    getTableDataByPage(currentPage.value, pageSize.value, noteSearch.value, value)
    getTotalSize(noteSearch.value, value)
    getTagList(noteSearch.value, value)
}

const handlePageChange = (val: number) => {
    getTableDataByPage(val, pageSize.value, noteSearch.value, tagSearch.value)
}

// eslint-disable-next-line 
const handleRowClick = (row: TableRow, column: TableColumnCtx<TableRow>, event: Event): void => {
    // 点击行事件，弹出note详情对话框
    console.log(row.id, row.content, row.tags, row.created_at)
    noteDialogConfig.visible = true
    noteDialogConfig.content = row.content
    noteDialogConfig.tags = row.tags
    noteDialogConfig.created_at = row.created_at
    noteDialogConfig.id = row.id
}

const mdPreviewShow = ref(true)
const mdTextEdit = ref<HTMLTextAreaElement | null>(null)
const handlemdTextEditBlur = () => {
    // textarea失去焦点时切换到markdown浏览模式
    if (noteDialogConfig.content === '') return
    mdPreviewShow.value = true
}

// eslint-disable-next-line 
const handleMdClick = (event: MouseEvent) => {
    // 点击markdown预览区域时切换到编辑模式
    if (noteDialogConfig.loading) return
    mdPreviewShow.value = false
    nextTick(() => {
        mdTextEdit.value?.focus()
    })
}

const handleNewNoteClick = () => {
    // 新建note按钮点击事件，弹出note详情对话框
    noteDialogConfig.id = -1
    noteDialogConfig.content = ''
    noteDialogConfig.created_at = new Date().toLocaleString()
    noteDialogConfig.tags = []
    noteDialogConfig.visible = true
    mdPreviewShow.value = false
    // console.log(noteDialogConfig)
}

const handleNoteChange = () => {
    // 确认note对话框按钮点击事件，提交note更改
    noteDialogConfig.loading = true
    console.log(
        'Note changed:',
        noteDialogConfig.content,
        noteDialogConfig.created_at,
        noteDialogConfig.id,
    )
    if (noteDialogConfig.content.length === 0) {
        // 无note内容，跳过编辑
        noteDialogConfig.visible = false
        noteDialogConfig.loading = false
        return
    }
    if (noteDialogConfig.id === -1) {
        axios.post(`${apiBase}/note/newNote`, {
            "content": noteDialogConfig.content,
            "tags": noteDialogConfig.tags,
            "created_at": noteDialogConfig.created_at,
        }).then((response) => {
            console.log('newNote', response.data)
            tableData.value.push({
                id: response.data,
                content: noteDialogConfig.content,
                created_at: noteDialogConfig.created_at,
                updated_at: noteDialogConfig.created_at,
                tags: noteDialogConfig.tags,
            })
            noteDialogConfig.visible = false
            noteDialogConfig.loading = false
        }).catch((error) => {
            console.log(error)
            noteDialogConfig.visible = false
            noteDialogConfig.loading = false
        }).finally(() => {
            noteDialogConfig.visible = false
            noteDialogConfig.loading = false
        })
    }
    else {
        axios.post(`${apiBase}/note/updateNote`, {
            "id": noteDialogConfig.id,
            "content": noteDialogConfig.content,
            "tags": noteDialogConfig.tags,
            "created_at": noteDialogConfig.created_at,
        }).then((response) => {
            console.log('updateNote', response.data)
            const index = tableData.value.findIndex(row => row.id === noteDialogConfig.id)
            if (index !== -1) {
                Object.assign(tableData.value[index]!, {
                    content: noteDialogConfig.content,
                    created_at: noteDialogConfig.created_at,
                    tags: noteDialogConfig.tags
                })
            }
            noteDialogConfig.visible = false
            noteDialogConfig.loading = false
        }).catch((error) => {
            console.log(error)
            noteDialogConfig.visible = false
            noteDialogConfig.loading = false
        }).finally(() => {
            noteDialogConfig.visible = false
            noteDialogConfig.loading = false
        })
    }
}

const hanldeNoteDelete = () => {
    // 删除note按钮点击事件，删除当前note
    noteDialogConfig.loading = true
    let displayContent = marked(noteDialogConfig.content)
        .toString()
        .replace(/(<([^>]+)>)/gi, '')
    displayContent =
        displayContent.length > 30 ? displayContent.substring(0, 30) + '...' : displayContent
    ElMessageBox.confirm('Note【' + displayContent + '】will be deleted. Continue?', 'Warning', {
        confirmButtonText: 'OK',
        cancelButtonText: 'Cancel',
        type: 'warning',
    })
        .then(() => {
            axios.post(`${apiBase}/note/deleteNote`, {
                id: noteDialogConfig.id
            }).then((res) => {
                console.log('res', res)
                if (res.data) {
                    const index = tableData.value.findIndex(row => row.id === noteDialogConfig.id)
                    if (index !== -1) {
                        tableData.value.splice(index, 1)
                    }
                }
            })
            console.log('Note deleted:', noteDialogConfig.content, noteDialogConfig.created_at)
            noteDialogConfig.loading = false
            noteDialogConfig.visible = false
            ElMessage({
                type: 'success',
                message: 'Delete completed',
            })
        })
        .catch(() => {
            noteDialogConfig.loading = false
        })
}
</script>

<template>
    <el-container>
        <el-header>Header</el-header>

        <el-main>
            <h1>This is an note page</h1>
            <el-button type="primary" plain @click="handleNewNoteClick">+ New Note</el-button>
            <el-table :data="tableData" :table-layout="tableLayout" @row-click="handleRowClick">
                <el-table-column prop="id" label="ID" width="80" />
                <el-table-column prop="content" show-overflow-tooltip>
                    <template #header>
                        <p>Note</p>
                        <el-input
                            v-model="noteSearch"
                            style="max-width: 16em"
                            placeholder="Search note"
                            clearable
                            size="small"
                            @change="handleNoteSearchChange"
                        />
                    </template>
                    <template #default="scope">
                        {{
                            marked(scope.row.content)
                                .toString()
                                .replace(/(<([^>]+)>)/gi, '')
                        }}
                    </template>
                </el-table-column>
                <el-table-column prop="tags" show-overflow-tooltip width="220">
                    <template #header>
                        <p>Tags</p>
                        <el-select
                            v-model="tagSearch"
                            multiple
                            filterable
                            remote
                            clearable
                            placeholder="Search tags"
                            :remote-method="handleTagFilterSelect"
                            :loading="loading"
                            size="small"
                            style="max-width: 180px"
                            @change="handleTagSearchChange"
                        >
                            <el-option
                                v-for="item in tagOptions"
                                :key="item.value"
                                :value="item.value"
                                :label="item.label"
                            />
                        </el-select>
                    </template>
                    <template #default="scope">
                        <el-tag
                            v-for="(item, index) in Array.isArray(scope.row.tags)
                                ? scope.row.tags
                                : [scope.row.tags]"
                            :key="index"
                            style="margin: 4px"
                        >
                            {{ item }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="created_at" label="Date" width="150"/>
            </el-table>

            <el-dialog v-model="noteDialogConfig.visible" :title="noteDialogConfig.id === -1? 'New Note':'Note'" :before-close="handleClose">
                <div v-loading="noteDialogConfig.loading"></div>
                <el-form :model="noteDialogConfig">
                    <el-form-item label="Content" label-width="5em">
                        <el-input
                            ref="mdTextEdit"
                            v-model="noteDialogConfig.content"
                            :autosize="{ minRows: 2, maxRows: 10 }"
                            type="textarea"
                            placeholder="Please input"
                            v-show="!mdPreviewShow"
                            @blur="handlemdTextEditBlur"
                            :disabled="noteDialogConfig.loading"
                        />
                        <MdPreview
                            v-model="noteDialogConfig.content"
                            @click="handleMdClick"
                            v-show="mdPreviewShow"
                            min-height="1em"
                        />
                    </el-form-item>
                    <el-form-item label="Tags" label-width="5em">
                        <el-select
                            v-model="noteDialogConfig.tags"
                            multiple
                            filterable
                            remote
                            clearable
                            allow-create
                            placeholder="Search tags"
                            :remote-method="handleNewNoteTagSearch"
                            :disabled="noteDialogConfig.loading"
                        >
                            <el-option
                                v-for="item in noteDialogConfig.tagOptions"
                                :key="item.value"
                                :value="item.value"
                                :label="item.label"
                            />
                        </el-select>
                        </el-form-item>
                    <el-form-item label="Time" label-width="5em">
                        <el-date-picker
                            v-model="noteDialogConfig.created_at"
                            type="datetime"
                            placeholder="DateTime"
                            format="YYYY/MM/DD hh:mm:ss"
                            value-format="x"
                            :disabled="noteDialogConfig.loading"
                        />
                    </el-form-item>
                </el-form>
                <template #footer>
                    <div class="dialog-footer">
                        <el-button @click="noteDialogConfig.visible = false">Cancel</el-button>
                        <el-button type="danger" @click="hanldeNoteDelete" v-show="noteDialogConfig.id > 0">Delete</el-button>
                        <el-button type="primary" @click="handleNoteChange"> Confirm </el-button>
                    </div>
                </template>
            </el-dialog>
        </el-main>

        <el-footer>
            <el-pagination
                v-model:current-page="currentPage"
                v-model:page-size="pageSize"
                :page-sizes="[10, 20, 50]"
                size="small"
                :background="true"
                :layout="pageLayout"
                :total="totalNotes"
                @current-change="handlePageChange"
            />
        </el-footer>
    </el-container>
</template>

<style scoped>
:deep(.el-table__row) {
    cursor: pointer;
}
.el-popper.el-tooltip {
    visibility: hidden;
}
</style>
