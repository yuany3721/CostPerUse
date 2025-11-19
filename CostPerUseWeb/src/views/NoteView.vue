<script setup lang="ts">
import { ref, nextTick } from 'vue'
import type { TableInstance } from 'element-plus'
import { MdPreview } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import { marked } from 'marked'

const tableLayout = ref<TableInstance['tableLayout']>('fixed')

type TableData = {
    id: number
    date: string
    tags: string[]
    content: string
}

const tableData = ref()
const currentPage = ref(1)
const pageSize = ref(10)
const totalNotes = ref(0)
const noteDialogConfig = reactive({
    visible: false,
    content: '',
    date: '',
    id: -1,
    loading: false,
    width: '5em',
})
const tagList = ref<ListItem[]>([])

function getTableDataByPage(
    pageNum: number,
    pageSize: number,
    noteFilter: string = '',
    tagFilter: Array<string> = [],
): void {
    const data: TableData[] = []
    const startIndex = (pageNum - 1) * pageSize
    const endIndex = pageNum * pageSize
    console.log('fetching data', pageNum, pageSize, noteFilter, tagFilter)
    const getdata: TableData[] = [
        {
            id: 1,
            date: '2016-05-03',
            tags: ['Tom', 'Jerry'],
            content:
                'No. 189, Grove St, No. 189, Grove St, No. 189, Grove St, No. 18. 189, Grove St, No. 189, Grove St, No. 189, Grove St, No. 18. 189, Grove St, No. 189, Grove St, No. 189, Grove St, No. 18. 189, Grove St, No. 189, Grove St, No. 189, Grove St, No. 18. 189, Grove St, No. 189, Grove St, No. 189, Grove St, No. 18. 189, Grove St, No. 189, Grove St, No. 189, Grove St, No. 18. 189, Grove St, No. 189, Grove St, No. 189, Grove St, No. 18. 189, Grove St, No. 189, Grove St, No. 189, Grove St, No. 189, Grove St, No. 189, Grove St, Los Angeles',
        },
        {
            id: 2,
            date: '2016-05-02 00:22:11',
            tags: ['Tom'],
            content: '<b>teet</b>\n# 1weaw \n## waeawe\nwaeaweaw561aw',
        },
        {
            id: 3,
            date: '2016-05-02 00:22:11',
            tags: ['Jerry'],
            content: '<b>teet</b>\n# 1weaw \n## waeawe\nwaeaweaw561aw',
        },
    ]
    data.push(...getdata)
    tableData.value = data
}

function getTotalSize(noteFilter: string = '', tagFilter: Array<string> = []) {
    // 请求note总数
    totalNotes.value = 400
    console.log('fetching total size', noteFilter, tagFilter)
}

function getTagList(noteFilter: string = '', tagFilter: Array<string> = []) {
    // 请求所有Tag列表
    if (tagFilter.length > 0) {
        tagList.value = tagFilter.map((tag) => ({
            value: tag.toLowerCase(),
            label: tag.toLowerCase(),
        }))
    } else {
        // tagFilter为空，请求所有tag
        console.log('Fetching all tags', noteFilter, tagFilter)
    }
    tagList.value = [
        { value: 'tom', label: 'tom' },
        { value: 'jerry', label: 'jerry' },
    ]
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

interface ListItem {
    value: string
    label: string
}

const handleNoteSearch = (note: string) => {
    // 请求后端搜索note
    console.log('Search note:', note)
}

const handleTagSelect = (query: string) => {
    // 本地页面搜索tag方法
    if (query) {
        loading.value = true
        setTimeout(() => {
            loading.value = false
            tagOptions.value = tagList.value.filter((item) => {
                return item.label.toLowerCase().includes(query.toLowerCase())
            })
        }, 200)
    } else {
        tagOptions.value = tagList.value
    }
}

const handleTagChange = (value: string[]) => {
    // 请求后端搜索tag
    console.log('Selected tags:', value)
}

const handlePageChange = (val: number) => {
    getTableDataByPage(val, pageSize.value)
}

const handleRowClick = (row: any, column: any, event: Event): void => {
    // 点击行事件，弹出note详情对话框
    console.log(row.id, row.content, row.tags, row.date)
    noteDialogConfig.visible = true
    noteDialogConfig.content = row.content
    noteDialogConfig.date = row.date
    noteDialogConfig.id = row.id
}

const mdPreviewShow = ref(true)
const mdTextEdit = ref<HTMLTextAreaElement | null>(null)
const handlemdTextEditBlur = () => {
    // textarea失去焦点时切换到markdown浏览模式
    mdPreviewShow.value = true
}

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
    noteDialogConfig.visible = true
    noteDialogConfig.content = ''
    noteDialogConfig.date = new Date().toString()
    // mdPreviewShow.value = true
    mdPreviewShow.value = false
    noteDialogConfig.id = -1
}

const handleNoteChange = () => {
    // 确认note对话框按钮点击事件，提交note更改
    noteDialogConfig.loading = true
    console.log(
        'Note changed:',
        noteDialogConfig.content,
        noteDialogConfig.date,
        noteDialogConfig.id,
    )
    if (noteDialogConfig.content.length === 0) {
        // 无note内容，跳过编辑
        noteDialogConfig.visible = false
        noteDialogConfig.loading = false
        return
    }
    setTimeout(() => {
        noteDialogConfig.visible = false
        noteDialogConfig.loading = false
    }, 1000)
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
            console.log('Note deleted:', noteDialogConfig.content, noteDialogConfig.date)
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
                            @change="handleNoteSearch"
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
                            :remote-method="handleTagSelect"
                            :loading="loading"
                            size="small"
                            style="max-width: 180px"
                            @change="handleTagChange"
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
                <el-table-column prop="date" label="Date" width="150" />
            </el-table>

            <el-dialog v-model="noteDialogConfig.visible" title="Note">
                <div v-loading="noteDialogConfig.loading"></div>
                <el-form :model="noteDialogConfig">
                    <el-form-item label="Content" :label-width="noteDialogConfig.width">
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
                    <el-form-item label="Time" :label-width="noteDialogConfig.width">
                        <el-date-picker
                            v-model="noteDialogConfig.date"
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
                        <el-button type="danger" @click="hanldeNoteDelete">Delete</el-button>
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
