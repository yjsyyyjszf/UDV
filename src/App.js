import React, { PureComponent } from 'react'
import { withStyles } from '@material-ui/core/styles'
import {connect} from 'react-redux'
import Dicomdir from './components/Dicomdir'
import DicomViewer from './components/DicomViewer'
import DicomHeader from './components/DicomHeader'
import Measurements from './components/Measurements'
import Settings from './components/Settings'
import AboutDlg from './components/AboutDlg'
import Histogram from './components/Histogram'
import LayoutTool from './components/LayoutTool'
import FsUI from './components/FsUI'
import DownloadZipDlg from './components/DownloadZipDlg'
import OpenMultipleFilesDlg from './components/OpenMultipleFilesDlg'
import AppBar from '@material-ui/core/AppBar'
import Collapse from '@material-ui/core/Collapse'
import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogContentText from '@material-ui/core/DialogContentText'
import DialogTitle from '@material-ui/core/DialogTitle'
import Divider from '@material-ui/core/Divider'
import Drawer from '@material-ui/core/Drawer'
import ExpandLess from '@material-ui/icons/ExpandLess'
import ExpandMore from '@material-ui/icons/ExpandMore'
import Icon from '@mdi/react'
import IconButton from '@material-ui/core/IconButton'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemIcon from '@material-ui/core/ListItemIcon'
import ListItemText from '@material-ui/core/ListItemText'
import MenuIcon from '@material-ui/icons/Menu'
import Popover from '@material-ui/core/Popover'
import Slider from '@material-ui/core/Slider'
import Snackbar from '@material-ui/core/Snackbar'
import TextField from '@material-ui/core/TextField'
import Toolbar from '@material-ui/core/Toolbar'
import Typography from '@material-ui/core/Typography'
//import { FixedSizeList } from 'react-window'
//import {List as ListVirtual} from 'react-virtualized'
import { 
  isMobile, 
  isTablet,
} from 'react-device-detect'
import {
  clearStore,
  localFileStore,
  dcmIsOpen,
  activeDcm,
  activeDcmIndex,
  activeMeasurements,
  setLayout,
  dcmTool, 
  setDicomdir,
  setZippedFile,
  setVolume,
  filesStore,
} from './actions/index'
import { 
  log,
  getPixelSpacing,
  getSpacingBetweenSlice,
  //getFileNameCorrect,
  getFileExtReal,
  isInputDirSupported,
  getSettingsFsView,
  getSettingsDicomdirView,
} from './functions'
import { 
  mdiAngleAcute,
  mdiArrowAll,
  mdiAxisArrow,
  mdiCamera,
  mdiChartHistogram,
  mdiCheck,
  mdiCheckboxIntermediate,
  mdiContentSaveOutline,   
  mdiCursorDefault, 
  mdiCursorPointer,
  mdiDelete,
  mdiEllipse,
  mdiEyedropper,
  mdiFileCabinet,
  mdiFileDocument, 
  mdiFileCad, 
  mdiFolder,
  mdiFolderMultiple,
  mdiGesture,
  mdiViewGridPlusOutline,
  mdiImageEdit,
  mdiInformationOutline,
  mdiInvertColors,
  mdiMagnify,
  mdiFolderOpen,
  mdiRefresh,
  mdiRectangle,
  mdiRuler,
  mdiSettings,
  mdiToolbox,
  mdiTools,
  mdiTrashCanOutline, 
  mdiVideo,
  mdiWeb,

  mdiPlay,
  mdiPause,
  mdiSkipBackward,
  mdiSkipForward,
  mdiSkipNext,
  mdiSkipPrevious,
} from '@mdi/js'

import './App.css'

log()

//localStorage.setItem("debug", "cornerstoneTools")

const drawerWidth = 240
const iconColor = '#FFFFFF'
let iconTool = null

const styles = theme => ({
  '@global': {
    body: {
        backgroundColor: theme.palette.common.black,
    },
  },

  grow: {
    flexGrow: 1,
  },

  root: {
    display: 'flex',
  },

  menuButton: {
    marginRight: theme.spacing(2),
  },

  title: {
    flexGrow: 1,
  },

  appBar: {
    position: 'relative',
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },

  appBarShift: {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },

  hide: {
    display: 'none',
  },

  drawer: {
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
  },

  drawerOpen: {
    width: drawerWidth,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },

  drawerClose: {
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    overflowX: 'hidden',
    width: theme.spacing(7) + 1,
    [theme.breakpoints.up('sm')]: {
      width: theme.spacing(9) + 1,
    },
  },

  // Loads information about the app bar, including app bar height
  toolbar: theme.mixins.toolbar,

  content: {
    flexGrow: 1,
    padding: theme.spacing(3),
  },

  listItemText: {
    fontSize: '0.85em',
    marginLeft: '-20px'
  },

})

class App extends PureComponent {

  constructor(props) {
    super(props)
    this.files = []
    this.file = null
    this.url = null
  
    this.mprData = {}
    this.mprPlane = ''
    
    this.volume = []
    this.mprSliceIndex = [0, 0, 0]

    this.fileOpen = React.createRef()
    this.showFileOpen = this.showFileOpen.bind(this)

    this.openDicomdir = React.createRef()
    this.showOpenDicomdir = this.showOpenDicomdir.bind(this)

    this.openFolder = React.createRef()
    this.showOpenFolder = this.showOpenFolder.bind(this)    

    this.openUrlField = React.createRef()
    
    this.dicomViewersRefs = []
    this.dicomViewers = []
    for(let i=0; i < 16; i++) {
      this.dicomViewers.push(this.setDcmViewer(i))
    }
  }

  state = { 
    anchorElLayout: null,   
    openMenu: false,
    openImageEdit: false,
    openTools: false,
    openMpr: false,
    visibleMainMenu: true,
    visibleHeader: false,
    visibleSettings: false,
    visibleToolbar: true,
    visibleOpenUrl: false,
    visibleToolbox: false,
    visibleMeasure: false,
    visibleClearMeasureDlg: false,
    visibleAbout: false,
    visibleDicomdir: false,
    visibleFileManager: false,
    visibleZippedFileDlg: false,
    visibleDownloadZipDlg: false,
    visibleOpenMultipleFilesDlg: false,
    toolState: 1,
    sliceIndex: 0,
    sliceMax: 1,
    listOpenFilesScrolling: false,
    visibleVolumeBuilding: false,
    visibleMprOrthogonal: false,
    visibleMprCoronal: false,
    visibleMprSagittal: false,
    visibleMprAxial: false,
  }

  setDcmViewer = (index) => {
    return (
      <DicomViewer 
        dcmRef={(ref) => {this.dicomViewersRefs[index] = ref}}
        index={index}
        runTool={ref => (this.runTool = ref)} 
        changeTool={ref => (this.changeTool = ref)} 
      />   
    )
  }

  getDcmViewerRef = (index) => {
    return this.dicomViewersRefs[index]
  }

  getDcmViewer = (index) => {
    return this.dicomViewers[index]
  }

  getActiveDcmViewer = () => {
    return this.dicomViewersRefs[this.props.activeDcmIndex]
  }  
  
  toggleFileManager = () => {
    if (getSettingsFsView() === 'left') {
      this.setState({visibleMainMenu: false, visibleFileManager: !this.state.visibleFileManager})
    } else {
      this.setState({visibleFileManager: !this.state.visibleFileManager})
    }
  }
  
  showFileOpen() {
    this.props.isOpenStore(false)
    this.fileOpen.current.click()
  }

  handleOpenLocalFs = (filesSelected) => {
    //console.log('handleOpenLocalFs: ', filesSelected)
    if (filesSelected.length > 1) {
      this.files = filesSelected
      this.changeLayout(1, 1)
      this.mprPlane = ''
      this.volume = []
      for(let i=0; i < 16; i++) 
        if (this.dicomViewersRefs[i] !== undefined) {
          // this.dicomViewersRefs[i].runTool('clear')
        }
      this.setState({sliceIndex: 0,
                     sliceMax: 1,
                     visibleMprOrthogonal: false, 
                     visibleMprCoronal: false, 
                     visibleMprSagittal: false, 
                     visibleMprAxial: false}, () => {
                       this.setState({visibleOpenMultipleFilesDlg: true})
                     })
    } else {
      const file = filesSelected[0]
      //console.log('file: ', file)
      if (file.type === 'application/x-zip-compressed' || file.type === 'application/zip') {
        this.file = file
        this.url = null
        this.setState({visibleZippedFileDlg: true})
      } else {
        this.setState({sliceIndex: 0, sliceMax: 1})
        this.props.setLocalFileStore(file)
        this.dicomViewersRefs[this.props.activeDcmIndex].runTool('clear')
        this.dicomViewersRefs[this.props.activeDcmIndex].runTool('openLocalFs', file)      
      }
    }
  }

  handleOpenSandboxFs = (fsItem) => {
    //this.hideMainMenu()
    this.dicomViewersRefs[this.props.activeDcmIndex].runTool('clear')
    this.dicomViewersRefs[this.props.activeDcmIndex].runTool('openSandboxFs', fsItem)
  }

  handleOpenImage = (index) => {
    console.log('handleOpenImage : ', index)
    const visibleMprOrthogonal = this.state.visibleMprOrthogonal
    const visibleMprSagittal = this.state.visibleMprSagittal
    const visibleMprCoronal = this.state.visibleMprCoronal
    const visibleMprAxial = this.state.visibleMprAxial
    const plane = this.mprPlanePosition()
    console.log('plane: ', plane)

    if (visibleMprOrthogonal) {
      if (this.props.activeDcmIndex === 0) {
        this.dicomViewersRefs[0].runTool('openimage', index)

      } else if (this.props.activeDcmIndex === 1) {
        if (plane === 'sagittal') { // then open axial plane in second view
          this.dicomViewersRefs[1].mprRenderXZPlane(this.dicomViewersRefs[0].filename, plane, index, this.mprData)
        } else if (plane === 'axial') { // then open coronal plane in second view
          this.dicomViewersRefs[1].mprRenderXZPlane(this.dicomViewersRefs[0].filename, plane, index, this.mprData)
        } else { // plane is coronal, then open axial in second view
          this.dicomViewersRefs[1].mprRenderYZPlane(this.dicomViewersRefs[0].filename, plane, index, this.mprData)
        }

      } else if (this.props.activeDcmIndex === 2) {
        if (plane === 'sagittal') { // then open axial plane in second view
          this.dicomViewersRefs[2].mprRenderYZPlane(this.dicomViewersRefs[0].filename, plane, index, this.mprData)
        } else if (plane === 'axial') { // then open coronal plane in second view
          this.dicomViewersRefs[2].mprRenderYZPlane(this.dicomViewersRefs[0].filename, plane, index, this.mprData)
        } else { // plane is coronal, then open axial in second view
          this.dicomViewersRefs[2].mprRenderXZPlane(this.dicomViewersRefs[0].filename, plane, index, this.mprData)
        }        
      }

    } else if ((plane === 'sagittal' && visibleMprSagittal) ||
               (plane === 'axial' && visibleMprAxial) ||
               (plane === 'coronal' && visibleMprCoronal))
      this.dicomViewersRefs[this.props.activeDcmIndex].runTool('openimage', index)
    else if (plane === 'sagittal' && visibleMprAxial)
      this.dicomViewersRefs[this.props.activeDcmIndex].mprRenderXZPlane(this.dicomViewersRefs[0].filename, plane, index, this.mprData)  
    else if (plane === 'sagittal' && visibleMprCoronal)
      this.dicomViewersRefs[this.props.activeDcmIndex].mprRenderYZPlane(this.dicomViewersRefs[0].filename, plane, index, this.mprData)   
    else if (plane === 'axial' && visibleMprSagittal)
      this.dicomViewersRefs[this.props.activeDcmIndex].mprRenderYZPlane(this.dicomViewersRefs[0].filename, plane, index, this.mprData)
    else if (plane === 'axial' && visibleMprCoronal)
      this.dicomViewersRefs[this.props.activeDcmIndex].mprRenderXZPlane(this.dicomViewersRefs[0].filename, plane, index, this.mprData)
    else if (plane === 'coronal' && visibleMprSagittal)
      this.dicomViewersRefs[this.props.activeDcmIndex].mprRenderYZPlane(this.dicomViewersRefs[0].filename, plane, index, this.mprData) 
    else if (plane === 'coronal' && visibleMprAxial)
      this.dicomViewersRefs[this.props.activeDcmIndex].mprRenderXZPlane(this.dicomViewersRefs[0].filename, plane, index, this.mprData) 
    else // it's not a possible MPR, then open as normal dicom file  
      this.dicomViewersRefs[this.props.activeDcmIndex].runTool('openimage', index)           
  }
  
/*
  handleOpenMprXZImage = (index) => {
    this.dicomViewersRefs[this.props.activeDcmIndex].mprRenderXZPlane(this.mprPlanePosition(), index)
  }

  handleOpenMprYZImage = (index) => {
    this.dicomViewersRefs[this.props.activeDcmIndex].mprRenderYZPlane(this.mprPlanePosition(), index)
  }
*/  
  handleOpenFileDicomdir = (file) => {
    this.dicomViewersRefs[this.props.activeDcmIndex].runTool('clear')
    this.dicomViewersRefs[this.props.activeDcmIndex].runTool('openLocalFs', file)
  }

  showOpenFolder() {
    this.openFolder.current.click()
  }

  showOpenDicomdir() {
    this.openDicomdir.current.click()
  }

  handleOpenFolder(files) {
    //console.log('handleOpenFolder: ', files)
    for (let i=0; i < files.length; i++) {
      this.files.push(files[i])
    }
    this.changeLayout(1, 1)
    this.mprPlane = ''
    this.volume = []
    for(let i=0; i < 16; i++) 
      if (this.dicomViewersRefs[i] !== undefined) {
        // this.dicomViewersRefs[i].runTool('clear')
      }
    this.setState({sliceIndex: 0,
                    sliceMax: 1,
                    visibleMprOrthogonal: false, 
                    visibleMprCoronal: false, 
                    visibleMprSagittal: false, 
                    visibleMprAxial: false}, () => {
                      this.setState({visibleOpenMultipleFilesDlg: true})
                    })
  }

  handleOpenDicomdir(files) {
    this.setState({ visibleDicomdir: false }, () => {
      let dicomdir = null
      let datafiles = []
      for (let i=0; i < files.length; i++) {
        if (files[i].webkitRelativePath.includes('DICOMDIR')) {
          dicomdir = files[i]
        } else {
          datafiles.push(files[i])
        }
      }
      if (dicomdir !== null) {
        this.props.setDicomdirStore({origin: 'local', dicomdir: dicomdir, files: datafiles})
        this.toggleDicomdir()
      }
    })
  }

  handleOpenFsDicomdir = (fsItem) => {
    this.props.setDicomdirStore({origin: 'fs', dicomdir: fsItem, files: []})
    this.toggleDicomdir()
  }

  componentDidMount() {
    // Need to set the renderNode since the drawer uses an overlay
    //this.dialog = document.getElementById('drawer-routing-example-dialog')
    window.scrollTo(0, 0)
  }


  showAppBar = () => {
    window.scrollTo(0, 0)
  }
  

  toggleMainMenu = () => {
    const visibleMainMenu = this.state.visibleMainMenu
    //const visibleFileManager = this.state.visibleFileManager
    if (getSettingsFsView() === 'left') {
      this.setState({ visibleMainMenu: !visibleMainMenu, visibleFileManager: false })
    } else {
      this.setState({ visibleMainMenu: !visibleMainMenu })
    }
  }
  
  showMainMenu = () => {
    this.setState({ visibleMainMenu: true })
  }

  hideMainMenu = () => {
    this.setState({ visibleMainMenu: false })
  }

  handleVisibility = (visibleMainMenu) => {
    this.setState({ visibleMainMenu })
  }


  toggleHeader = () => {
    const visible = !this.state.visibleHeader
    this.setState({ visibleHeader: visible })
    if (visible) 
      this.setState({ 
        visibleMeasure: false, 
        visibleToolbox: false, 
        visibleDicomdir: false, 
        visibleFileManager: false 
      })    
  }


  toggleToolbox = () => {
    const visible = !this.state.visibleToolbox
    this.setState({ visibleToolbox: visible })
    if (visible) 
      this.setState({ 
        visibleMeasure: false, 
        visibleHeader: false, 
        visibleDicomdir: false, 
        visibleFileManager: false 
      })
  }

  saveMeasure = () => {
    this.dicomViewersRefs[this.props.activeDcmIndex].runTool('savetools')
  }
  
  toggleMeasure = () => {
    const visible = !this.state.visibleMeasure
    this.setState({ visibleMeasure: visible })
    if (visible) 
      this.setState({ 
        visibleToolbox: false, 
        visibleHeader: false, 
        visibleDicomdir: false, 
        visibleFileManager: false 
      })
  }

  hideMeasure = () => {
    this.setState({ visibleMeasure: false })
  }

  handleVisibilityMeasure = (visibleMeasure) => {
    this.setState({ visibleMeasure })
  }


  toggleDicomdir = () => {
    const visible = !this.state.visibleDicomdir
    console.log('toggleDicomdir: ', visible)
    this.setState({ visibleDicomdir: visible })
    if (visible) 
      this.setState({ 
        visibleMeasure: false, 
        visibleToolbox: false, 
        visibleHeader: false, 
        visibleFileManager: false
      })
  }
  

  clearMeasure = () => {
    this.showClearMeasureDlg()
  }

  showClearMeasureDlg = () => {
    this.setState({ visibleClearMeasureDlg: true })
  }

  hideClearMeasureDlg = () => {
      this.setState({ visibleClearMeasureDlg: false })
  }

  confirmClearMeasureDlg = () => {
    this.hideClearMeasureDlg()
    this.dicomViewersRefs[this.props.activeDcmIndex].runTool('removetools')
  }


  showZippedFileDlg = () => {
    this.setState({ visibleZippedFileDlg: true })
  }  

  hideZippedFileDlg = () => {
      this.setState({ visibleZippedFileDlg: false })
  }

  confirmZippedFileDlg = () => {
    this.hideZippedFileDlg()
    this.setState({ visibleFileManager: true }, () => {
      console.log('this.url: ', this.url)
      if (this.url !== null) {
        this.setState({visibleDownloadZipDlg: true})
      } else {
        this.props.setFsZippedFile(this.file)
      }
    })
  }


  showAbout = () => {
    this.setState({ visibleAbout: !this.state.visibleAbout })
  }
  
  showSettings = () => {
    this.setState({ 
      visibleMainMenu: false, 
      visibleSettings: true, 
      visibleToolbar: false, 
      position: 'right' 
    })
  }

  hideSettings = () => {
    this.setState({ 
      visibleMainMenu: true, 
      visibleSettings: false, 
      visibleToolbar: true,
      visibleFileManager: false,
      visibleDicomdir: false, 
    })
  }

  handleVisibilitySettings = (visibleSettings) => {
    this.setState({ visibleSettings })
  }

  hideDownloadZipDlg = () => {
    this.setState({ visibleDownloadZipDlg: false })
  }

  hideOpenMultipleFilesDlg = () => {
    this.setState({ visibleOpenMultipleFilesDlg: false })
    this.openMultipleFilesCompleted()
  }

  openMultipleFilesCompleted = () => {
    if (this.props.files !== null) {
      this.changeLayout(1, 1)
      this.dicomViewersRefs[this.props.activeDcmIndex].runTool('openimage', 0)
      const sliceMax = this.props.files.length
      this.setState({sliceMax: sliceMax}, () => {
        this.mprPlanePosition()
        if (this.mprPlane === 'sagittal')
          this.setState({ visibleMprOrthogonal: false, visibleMprSagittal: true, visibleMprAxial: false, visibleMprCoronal: false})
        else if (this.mprPlane === 'coronal')
          this.setState({ visibleMprOrthogonal: false, visibleMprSagittal: false, visibleMprAxial: false, visibleMprCoronal: true })  
        else 
          this.setState({ visibleMprOrthogonal: false, visibleMprSagittal: false, visibleMprAxial: true, visibleMprCoronal: false })       
      })
    }    
  }

  showOpenUrl = () => {
    this.setState({ visibleOpenUrl: true })
  }

  hideOpenUrl = (openDlg) => {
    this.setState({ visibleOpenUrl: false },
      () => {
        if (openDlg) {
          this.hideMainMenu()
          this.file = null
          this.url = this.openUrlField.value
          //console.log('this.url :', this.url)
          //const ext = getFileExtReal(this.url)
          //console.log('ext :', ext)
          if (getFileExtReal(this.url) === 'zip') {
            this.setState({visibleZippedFileDlg: true})
          } else {
            return this.dicomViewersRefs[this.props.activeDcmIndex].runTool('openurl', this.openUrlField.value)
          }
        } 
    })
  }

  downloadOpenUrl = () => {
    this.setState({ visibleOpenUrl: false, visibleToolbar: true })
  }
  
  resetImage = () => {
    this.dicomViewersRefs[this.props.activeDcmIndex].runTool('reset')
  }
  
  saveShot = () => {
    this.dicomViewersRefs[this.props.activeDcmIndex].runTool('saveas')
  }

  cinePlayer = () => {
    this.dicomViewersRefs[this.props.activeDcmIndex].runTool('cine')
  }

  clear = () => {  
    this.setState({openImageEdit: false, openTools: false, openMpr: false, visibleToolbox: false, visibleMeasure: false, visibleHeader: false, visibleDicomdir: false})
    this.changeLayout(1, 1)
    this.props.setFilesStore(null)
    this.props.setDicomdirStore(null)
    this.props.clearingStore()
    this.dicomViewersRefs[this.props.activeDcmIndex].runTool('clear')
  }

  handleLayout = (event) => {
    this.setState({anchorElLayout: event.currentTarget})
  }
  
  closeLayout = () => {
    this.setState({anchorElLayout: null})
  }

  changeLayout = (row, col) => {
    // if reduce the grid clear the unused views
    if (row < this.props.layout[0] || col < this.props.layout[1]) {
      this.layoutGridClick(0)
      for(let i=0; i < 4; i++) {
        for(let j=0; j < 4; j++) {
          if ((i+1 > row) || (j+1 > col)) {
            const index = i*4+j
            if (this.dicomViewersRefs[index] !== undefined) {  
              //this.dicomViewersRefs[index].runTool('clear')
            }
          }
        }
      }
    }
    this.props.setLayoutStore(row, col)
  }

  toolExecute = (tool) => {
    this.hideMainMenu()
    switch (tool) {
      case 'notool': 
        iconTool = null
        this.setState({toolState: null})
        break
      case 'Wwwc':
        iconTool = mdiArrowAll
        break
      case 'Pan':
        iconTool = mdiCursorPointer
        break        
      case 'Zoom':
        iconTool = mdiMagnify
        break        
      case 'Length':
        iconTool = mdiRuler
        break       
      case 'Probe':
        iconTool = mdiEyedropper
        break    
      case 'Angle':
        iconTool = mdiAngleAcute
        break   
      case 'EllipticalRoi':
        iconTool = mdiEllipse
        break     
      case 'RectangleRoi':
        iconTool = mdiRectangle
        break
      case 'FreehandRoi':
        iconTool = mdiGesture
        break       

      default:
          break     
    }
    this.props.toolStore(tool)
    this.dicomViewersRefs[this.props.activeDcmIndex].runTool(tool)
  }

  toolChange = () => {
    const toolState = 1-this.state.toolState
    this.setState({toolState: toolState}, () => {
      this.changeTool.changeTool(this.props.tool, toolState)
    })
  }

  toolRemove = (index) => {
    this.dicomViewersRefs[this.props.activeDcmIndex].runTool('removetool', index)
  }

  toggleOpenMenu = () => {
    this.setState({openMenu: !this.state.openMenu})
  } 

  toggleImageEdit = () => {
    this.setState({openImageEdit: !this.state.openImageEdit})
  }

  toggleTools = () => {
    this.setState({openTools: !this.state.openTools})
  } 

  toggleMpr = () => {
    this.setState({openMpr: !this.state.openMpr})
  } 

  layoutGridClick = (index) => {
    if (isMobile && index === this.props.activeDcmIndex) return
    
    this.mprSliceIndex[this.props.activeDcmIndex] = this.state.sliceIndex

    this.props.setActiveDcmIndex(index)

    if (this.state.visibleMprOrthogonal) {
      if (index === 0) {
        const sliceMax = this.props.files === null ? 1 : this.props.files.length
        this.setState({sliceMax: sliceMax, sliceIndex: this.mprSliceIndex[0]})

      } else if (index === 1) {
        const sliceMax = this.props.files[0].image.columns
        this.setState({sliceMax: sliceMax, sliceIndex: this.mprSliceIndex[1]})

      } else if (index === 2) {
        const sliceMax = this.props.files[0].image.rows
        this.setState({sliceMax: sliceMax, sliceIndex: this.mprSliceIndex[2]})
      }
    }  

    const dcmViewer = this.getDcmViewerRef(index)
    //console.log('dcmViewer:', dcmViewer)
    this.props.setActiveMeasurements(dcmViewer.measurements)
    this.props.setActiveDcm({image: dcmViewer.image, element: dcmViewer.dicomImage, isDicom: dcmViewer.isDicom})
  }
 
  layoutGridTouch = (index) => {
    if (!isMobile && index === this.props.activeDcmIndex) return
    
    this.mprSliceIndex[this.props.activeDcmIndex] = this.state.sliceIndex

    this.props.setActiveDcmIndex(index)

    if (this.state.visibleMprOrthogonal) {
      if (index === 0) {
        const sliceMax = this.props.files === null ? 1 : this.props.files.length
        this.setState({sliceMax: sliceMax, sliceIndex: this.mprSliceIndex[0]})

      } else if (index === 1) {
        const sliceMax = this.props.files[0].image.columns
        this.setState({sliceMax: sliceMax, sliceIndex: this.mprSliceIndex[1]})

      } else if (index === 2) {
        const sliceMax = this.props.files[0].image.rows
        this.setState({sliceMax: sliceMax, sliceIndex: this.mprSliceIndex[2]})
      }
    }    

    const dcmViewer = this.getDcmViewerRef(index)
    this.props.setActiveMeasurements(dcmViewer.measurements)
    this.props.setActiveDcm({image: dcmViewer.image, element: dcmViewer.dicomImage, isDicom: dcmViewer.isDicom})   
  }

  buildLayoutGrid = () => {
    let dicomviewers = []
    for(let i=0; i < this.props.layout[0]; i++) {
      for(let j=0; j < this.props.layout[1]; j++) {
        const styleLayoutGrid = {
          border: this.props.layout[0] === 1 && this.props.layout[1] === 1 ? 'solid 1px #000000' : 'solid 1px #444444',
        }
        const index = i*4+j
        dicomviewers.push(
          <div 
            key={index} 
            style={styleLayoutGrid} 
            onClick={() => this.layoutGridClick(index)} 
            onTouchStart={() => this.layoutGridTouch(index)}
          >
            {this.getDcmViewer(index)}
          </div>        
        )
      }
    }

    return (
      <div
        id="dicomviewer-grid"
        style={{
          display: 'grid',
          gridTemplateRows: `repeat(${this.props.layout[0]}, ${100 / this.props.layout[0]}%)`,
          gridTemplateColumns: `repeat(${this.props.layout[1]}, ${100 / this.props.layout[1]}%)`,
          height: '100%',
          width: '100%',
        }}
      >
        {dicomviewers}
      </div>
    )
  }

  getFileName = (dcmViewer) => {
    return dcmViewer.filename
    /*if (dcmViewer.fsItem !== null) {
      return dcmViewer.fsItem.name
    } else if (dcmViewer.localfile !== null) {
      return getFileNameCorrect(dcmViewer.localfile.name)
    } else {
      return dcmViewer.localurl.substring(dcmViewer.localurl.lastIndexOf('/')+1)
    }*/
  }

  getStringVisiblePlane = () => {
    if (this.state.visibleMprOrthogonal) 
      return 'orthogonal'    
    else if (this.state.visibleMprSagittal) 
      return 'sagittal'
    else if (this.state.visibleMprAxial) 
      return 'axial'
    else if (this.state.visibleMprCoronal) 
      return 'coronal'
  }

  appBarTitle = (classes, isOpen, dcmViewer) => {
    if (isMobile && !isTablet) {
      if (isOpen) 
        return null
      else 
        return (
          <Typography variant="overline" className={classes.title}>
            <strong>U</strong>niversal <strong>D</strong>icom <strong>V</strong>iewer
          </Typography>          
        )
    } else {
      if (isOpen) {
        const plane = this.getStringVisiblePlane()
        if (this.state.sliceMax > 1 && this.mprPlane !== plane && this.mprPlane !== '') {
          return (
            <Typography variant="overline" className={classes.title}>
              {'MPR '+plane}
            </Typography>
          )        
        }
        return (
          <Typography variant="overline" className={classes.title}>
            {this.getFileName(dcmViewer)}
          </Typography>
        )
      } else if (this.props.dicomdir !== null) {
        return (
          <Typography variant="overline" className={classes.title}>
            {this.props.dicomdir.dicomdir.webkitRelativePath}
          </Typography>
        )
      } else
        return (
          <Typography variant="overline" className={classes.title}>
            <strong>U</strong>niversal <strong>D</strong>icom <strong>V</strong>iewer
          </Typography>
        )
    }
  }

  // ---------------------------------------------------------------------------------------------- MPR
  
  getImageOrientationZ = (image) => {
    const iop = image.data.string('x00200037').split('\\') // Image Orientation Patient

    let v = new Array(3).fill(0).map(() => new Array(3).fill(0))

    v[0][0] = parseFloat(iop[0]) // the x direction cosines of the first row X
    v[0][1] = parseFloat(iop[1]) // the y direction cosines of the first row X
    v[0][2] = parseFloat(iop[2]) // the z direction cosines of the first row X
    v[1][0] = parseFloat(iop[3]) // the x direction cosines of the first column Y
    v[1][1] = parseFloat(iop[4]) // the y direction cosines of the first column Y
    v[1][2] = parseFloat(iop[5]) // the z direction cosines of the first column Y 
    console.log('getImageOrientationZ: ', v[1][2])
    return v[1][2]
  }

  mprBuildVolume = () => {
    if (this.volume.length > 0) return

    this.t0 = performance.now()

    const files = this.props.files
    const xPixelSpacing = getPixelSpacing(files[0].image, 0)
    const spacingBetweenSlice = getSpacingBetweenSlice(files[0].image)
    const length = files[0].image.getPixelData().length
    this.volume = []
    this.mprData.zDim = Math.round(files.length * spacingBetweenSlice / xPixelSpacing)
    //console.log('this.mprData.zDim: ', this.mprData.zDim)

    if (files.length === this.mprData.zDim) { // slices contiguous
      for (let i = 0, len = files.length; i < len; i++) {
        this.volume.push(files[i].image.getPixelData())
      }
      
    } else if (files.length < this.mprData.zDim) { // gap between slices
      //const step = this.mprData.zDim / files.length
      
      let emptyPlane = new Int16Array(length).fill(0)
      for (let i = 0, len = this.mprData.zDim; i < len; i++) {
        this.volume.push(emptyPlane)
      }

      let order = []
      for (let i = 0; i < files.length; i++) {
        order.push({iFile: i, instanceNumber: files[i].instanceNumber, sliceDistance: files[i].sliceDistance, sliceLocation: files[i].sliceLocation})
      }

      
      // const reorder = files[0].sliceDistance < files[1].sliceDistance
      const reorder = files[0].sliceLocation < files[1].sliceLocation
      if (reorder) {
        order.sort((l, r) => {
          // return l.instanceNumber - r.instanceNumber
          //return r.sliceDistance - l.sliceDistance
          return r.sliceLocation - l.sliceLocation
        })     
        console.log('reorder: ')     
      }
      
      /*if (this.getImageOrientationZ(files[0].image) < 0) {
        order.sort((l, r) => {
          return r.instanceNumber - l.instanceNumber
          // return r.sliceDistance - l.sliceDistance
        })     
        console.log('reorder 2: ')        
      }*/

      let intervals = [0]
      this.volume[0] = files[order[0].iFile].image.getPixelData()
      this.volume[this.mprData.zDim-1] = files[order[files.length-1].iFile].image.getPixelData()  
      const step = Math.floor((this.mprData.zDim-2) / (files.length-2))
      let i = 0
      for (let k = 1; k <= files.length-2; k++) {  
          i += step
          //console.log(`i: ${i},  k: ${k},  order[k].iFile: ${order[k].iFile}`)
          this.volume[i] = files[order[k].iFile].image.getPixelData() // order[k-1].iFile
          intervals.push(i)
      }
      intervals.push(this.mprData.zDim-1)

      //console.log('this.volume: ', this.volume)

      // build missing planes without interpolation
      /*for (let i = 0; i < intervals.length-1; i++) {
        console.log(`intervals: ${intervals[i]} - ${intervals[i+1]}`)
        for (let j = intervals[i]+1; j < intervals[i+1]; j++) {
          console.log(`j: ${j}`)
          this.volume[j] = this.volume[intervals[i+1]]
          console.log(`this.volume[j]: ${this.volume[j]}`)
          break
        }
      }*/

      // build the interpolate planes between original planes
      for (let i = 0; i < intervals.length-1; i++) {
        //console.log(`intervals: ${intervals[i]} - ${intervals[i+1]}`)
        const step = intervals[i+1]-intervals[i]

        for (let j = intervals[i]+1; j < intervals[i+1]; j++) {
          //console.log(`i: ${i}, intervals[i]: ${intervals[i]}, j: ${j}`)

          let p = new Int16Array(length)
          const w = (j-intervals[i]) / step

          for (let k = 0; k < length-1; k++) {
            // simple linear interpolation
            /*const p0 = this.volume[intervals[i]][k]
            const p1 = this.volume[intervals[i+1]][k]
            p[k] = (p0+p1)/2*/    

            // weighted linear interpolation
            const p0 = this.volume[intervals[i]][k] * (1-w)
            const p1 = this.volume[intervals[i+1]][k] * w
            p[k] = p0+p1

            // weighted bilinear interpolation
            /*if (k-1 > 0 && k+1 < length) {
              const p0 = this.volume[intervals[i]][k] * (1-w) * 0.5 + this.volume[intervals[i]][k-1] * (1-w) * 0.25 + this.volume[intervals[i]][k+1] * (1-w) * 0.25
              const p1 = this.volume[intervals[i+1]][k] * w * 0.5 + this.volume[intervals[i+1]][k-1] * w * 0.25 + this.volume[intervals[i+1]][k+1] * w * 0.25
              p[k] = p0+p1
            } else if (k-1 < 0) {
              const p0 = this.volume[intervals[i]][k] * (1-w) * 0.75 + this.volume[intervals[i]][k+1] * (1-w) * 0.25
              const p1 = this.volume[intervals[i+1]][k] * w * 0.5 + this.volume[intervals[i+1]][k+1] * w * 0.25
              p[k] = p0+p1
            } else { // k+1 > length 
              const p0 = this.volume[intervals[i]][k] * (1-w) * 0.75 + this.volume[intervals[i]][k-1] * (1-w) * 0.25
              const p1 = this.volume[intervals[i+1]][k] * w * 0.5 + this.volume[intervals[i+1]][k-1] * w * 0.25
              p[k] = p0+p1
            }*/
          }

          this.volume[j]= p
        }
      }

      this.t1 = performance.now()
      console.log(`performance volume building: ${this.t1-this.t0} milliseconds`)

    } else { // overlapping slices
      this.mprData.zStep = files.length / this.mprData.zDim
      //console.log('this.mprData.zStep: ', this.mprData.zStep)
      for (let i = 0, len = this.mprData.zDim; i < len; i++) {
        const k = Math.round(i*this.mprData.zStep)
        this.volume.push(files[k].image.getPixelData())
      }    
    }

    if (this.state.visibleMprOrthogonal) {
      this.changeToOrthogonalView()

    } else if (this.state.visibleMprSagittal) {
      this.changeToSagittalView()

    } else if (this.state.visibleMprCoronal) {
      this.changeToCoronalView()  

    } else { // axial
      this.changeToAxialView()
    }
  }

  changeToOrthogonalView = () => {  
    this.changeLayout(1, 3)

    this.setState({visibleVolumeBuilding: false}, () => {
      const plane = this.mprPlanePosition()

      const index = Math.round(this.props.files.length / 2)

      if (this.dicomViewersRefs[0].volume === null)
        this.dicomViewersRefs[0].volume = this.volume

      this.mprSliceIndex[0] = index  
      this.dicomViewersRefs[0].runTool('openimage', index)

      if (this.dicomViewersRefs[1].volume === null)
        this.dicomViewersRefs[1].volume = this.volume
      const xzIndex = Math.round(this.props.files[0].image.columns / 2)
      this.mprSliceIndex[1] = xzIndex
      this.dicomViewersRefs[1].mprRenderXZPlane(this.dicomViewersRefs[0].filename, plane, xzIndex, this.mprData)  
      
      if (this.dicomViewersRefs[2].volume === null)
        this.dicomViewersRefs[2].volume = this.volume
      const yzIndex = Math.round(this.props.files[0].image.rows / 2)
      this.mprSliceIndex[2] = yzIndex
      this.dicomViewersRefs[2].mprRenderYZPlane(this.dicomViewersRefs[0].filename, plane, yzIndex, this.mprData)      
    })

  }

  changeToSagittalView = () => {
    this.changeLayout(1, 1)

    this.setState({visibleVolumeBuilding: false}, () => {
      const plane = this.mprPlanePosition()

      if (this.dicomViewersRefs[this.props.activeDcmIndex].volume === null)
        this.dicomViewersRefs[this.props.activeDcmIndex].volume = this.volume
      //console.log('mprSagittal, this.mprPlanePosition(): ', plane)

      if (plane === 'sagittal') {
        const sliceMax = this.props.files === null ? 1 : this.props.files.length
        const index = Math.round(sliceMax / 2)
        this.setState({sliceIndex: index, sliceMax: sliceMax})
        this.dicomViewersRefs[this.props.activeDcmIndex].runTool('openimage', index)

      } else if (plane === 'axial') {
        const sliceMax = this.props.files[0].image.columns
        const index = Math.round(sliceMax / 2)
        this.setState({sliceIndex: index, sliceMax: sliceMax})          
        this.dicomViewersRefs[this.props.activeDcmIndex].mprRenderYZPlane(this.dicomViewersRefs[0].filename, plane, index, this.mprData)

      } else {
        const sliceMax = this.props.files[0].image.rows
        const index = Math.round(sliceMax / 2)
        this.setState({sliceIndex: index, sliceMax: sliceMax}) 
        this.dicomViewersRefs[this.props.activeDcmIndex].mprRenderXZPlane(this.dicomViewersRefs[0].filename, plane, index, this.mprData)
      }      
    })
  }

  changeToCoronalView = () => {  
    this.changeLayout(1, 1)

    this.setState({visibleVolumeBuilding: false}, () => {
      const plane = this.mprPlanePosition()

      if (this.dicomViewersRefs[this.props.activeDcmIndex].volume === null)
        this.dicomViewersRefs[this.props.activeDcmIndex].volume = this.volume
      //console.log('mprCoronal, this.mprPlanePosition(): ', plane)

      if (plane === 'coronal') {
        const sliceMax = this.props.files === null ? 1 : this.props.files.length
        const index = Math.round(sliceMax / 2)
        this.setState({sliceIndex: index, sliceMax: sliceMax})
        this.dicomViewersRefs[this.props.activeDcmIndex].runTool('openimage', index)        

      } else if (plane === 'axial') {
        const sliceMax = this.props.files[0].image.columns
        const index = Math.round(sliceMax / 2)
        this.setState({sliceIndex: index, sliceMax: sliceMax})
        this.dicomViewersRefs[this.props.activeDcmIndex].mprRenderXZPlane(this.dicomViewersRefs[0].filename, plane, index, this.mprData)

      } else { // plane is sagittal
        const sliceMax = this.props.files[0].image.rows
        const index = Math.round(sliceMax / 2)
        this.setState({sliceIndex: index, sliceMax: sliceMax})  
        this.dicomViewersRefs[this.props.activeDcmIndex].mprRenderYZPlane(this.dicomViewersRefs[0].filename, plane, index, this.mprData)
      }      
    })
  }

  changeToAxialView = () => {  
    this.changeLayout(1, 1)

    this.setState({visibleVolumeBuilding: false}, () => {
      const plane = this.mprPlanePosition()
          
      if (this.dicomViewersRefs[this.props.activeDcmIndex].volume === null)
        this.dicomViewersRefs[this.props.activeDcmIndex].volume = this.volume
      //console.log('mprAxial, this.mprPlanePosition(): ', plane)

      if (plane === 'axial') {
        const sliceMax = this.props.files === null ? 1 : this.props.files.length
        const index = Math.round(sliceMax / 2)
        this.setState({sliceIndex: index, sliceMax: sliceMax})
        this.dicomViewersRefs[this.props.activeDcmIndex].runTool('openimage', index)

      } else if (plane === 'sagittal') {
        const sliceMax = this.props.files[0].image.columns
        const index = Math.round(sliceMax / 2)
        this.setState({sliceIndex: index, sliceMax: sliceMax})
        this.dicomViewersRefs[this.props.activeDcmIndex].mprRenderXZPlane(this.dicomViewersRefs[0].filename, plane, index, this.mprData)

      } else {
        const sliceMax = this.props.files[0].image.rows
        const index = Math.round(sliceMax / 2)
        this.setState({sliceIndex: index, sliceMax: sliceMax})             
        this.dicomViewersRefs[this.props.activeDcmIndex].mprRenderYZPlane(this.dicomViewersRefs[0].filename, plane, index, this.mprData)
      }      
    })
  }

  mprPlanePosition = () => {
    if (this.mprPlane === '') {
      this.mprPlane = this.dicomViewersRefs[this.props.activeDcmIndex].mprPlanePosition()
    }
    return this.mprPlane  
  }

  mprOrthogonal = () => {
    const visibleMprOrthogonal = this.state.visibleMprOrthogonal
    if (!visibleMprOrthogonal) {
      const index = Math.round(this.props.files.length / 2)
      //console.log('mprOrthogonal, index: ', index)
      this.setState({sliceIndex: index})
      this.setState({visibleMprOrthogonal: true, 
                    visibleMprCoronal: false, 
                    visibleMprSagittal: false, 
                    visibleMprAxial: false}, () => {
        if (this.volume.length === 0) {   
          this.setState({visibleVolumeBuilding: true}, () => {           
            setTimeout(() => {
              this.mprBuildVolume()
            }, 100)   
          })
        } else {
          this.changeToOrthogonalView()
        }
      })
    }
  }

  mprSagittal = () => {
    const visibleMprSagittal = this.state.visibleMprSagittal
    if (!visibleMprSagittal) {
      this.setState({visibleMprOrthogonal: false, 
                    visibleMprSagittal: true, 
                    visibleMprCoronal: false, 
                    visibleMprAxial: false}, () => {
        if (this.volume.length === 0) {   
          this.setState({visibleVolumeBuilding: true}, () => {           
            setTimeout(() => {
              this.mprBuildVolume()
            }, 100)   
          })
        } else {
          this.changeToSagittalView()
        }
      })
    }
  }
    
  mprCoronal = () => {
    const visibleMprCoronal = this.state.visibleMprCoronal
    if (!visibleMprCoronal) {
      this.setState({visibleMprOrthogonal: false, 
                     visibleMprSagittal: false, 
                     visibleMprCoronal: true, 
                     visibleMprAxial: false}, () => {
        if (this.volume.length === 0) {   
          this.setState({visibleVolumeBuilding: true}, () => {           
            setTimeout(() => {
              this.mprBuildVolume()
            }, 100)   
          })
        } else {
          this.changeToCoronalView()
        }
      })
    }
  }

  mprAxial = () => {
    const visibleMprAxial = this.state.visibleMprAxial
    if (!visibleMprAxial) {
      this.setState({visibleMprOrthogonal: false, 
                     visibleMprSagittal: false, 
                     visibleMprCoronal: false, 
                     visibleMprAxial: true}, () => {
        if (this.volume.length === 0) {   
          this.setState({visibleVolumeBuilding: true}, () => {           
            setTimeout(() => {
              this.mprBuildVolume()
            }, 100)   
          })
        } else {
          this.changeToAxialView()
        }
      })
    }
  }

  // ---------------------------------------------------------------------------------------------- MPR end
  
  listOpenFilesFirstFrame = () => {
    const index = 0
    //this.props.setLocalFileStore(this.files[index])
    this.setState({sliceIndex: index}, () => {
      this.handleOpenImage(index)
    })
  }

  listOpenFilesPreviousFrame = () => {
    let index = this.state.sliceIndex
    index = index === 0 ? this.props.files.length-1 : index-1
    //this.props.setLocalFileStore(this.files[index])
    this.setState({sliceIndex: index}, () => {
      this.handleOpenImage(index)
    })
  } 

  listOpenFilesNextFrame = () => {
    let index = this.state.sliceIndex
    index = index === this.props.files.length-1 ? 0 : index+1
    //this.props.setLocalFileStore(this.files[index])
    this.setState({sliceIndex: index}, () => {
      this.handleOpenImage(index)
    })
  }  

  listOpenFilesLastFrame = () => {
    const index = this.props.files.length-1
    //this.props.setLocalFileStore(this.files[index])
    this.setState({sliceIndex: index}, () => {
      this.handleOpenImage(index)
    })
  }  

  listOpenFilesScrolling = () => {  
    const scrolling = this.state.listOpenFilesScrolling
    this.setState({listOpenFilesScrolling: !scrolling}, () => {
      if (scrolling) {
        clearInterval(this.timerScrolling)
      } else {
        this.timerScrolling = setInterval(() => {
          this.listOpenFilesNextFrame()
        }, 500)
      }      
    })
  }

  handleSliceChange = (event, value) => {
    console.log('slice value: ', Math.floor(value))
    this.setState({sliceIndex: Math.floor(value)}, () => {
      let index = this.state.sliceIndex
      this.props.setLocalFileStore(this.files[index])
      this.handleOpenImage(index)
    })
  }

  render() {
    //console.log('App render: ')

    const { classes } = this.props

    const primaryClass = {primary:classes.listItemText}
    const iconSize = '1.2rem'
    
    const isOpen = this.props.isOpen[this.props.activeDcmIndex]
    const isDicomdir = this.props.dicomdir !== null
    const isMultipleFiles = this.props.files === null ? false : this.props.files.length > 1
    
    const openMenu = this.state.openMenu
    const openImageEdit = this.state.openImageEdit
    const openTools = this.state.openTools
    const openMpr = this.state.openMpr && isMultipleFiles && this.mprPlane !== ''
    const visibleMainMenu = this.state.visibleMainMenu
    const visibleHeader = this.state.visibleHeader
    const visibleSettings = this.state.visibleSettings
    const visibleAbout = this.state.visibleAbout
    const visibleMeasure = this.state.visibleMeasure
    const visibleToolbox = this.state.visibleToolbox
    const visibleDicomdir = this.state.visibleDicomdir
    const visibleFileManager = this.state.visibleFileManager
    const visibleClearMeasureDlg = this.state.visibleClearMeasureDlg
    const visibleZippedFileDlg = this.state.visibleZippedFileDlg 
    const visibleDownloadZipDlg = this.state.visibleDownloadZipDlg
    const visibleOpenMultipleFilesDlg = this.state.visibleOpenMultipleFilesDlg
    const visibleLayout = Boolean(this.state.anchorElLayout)
    const visibleVolumeBuilding = this.state.visibleVolumeBuilding
    const visibleMprOrthogonal = this.state.visibleMprOrthogonal
    const visibleMprCoronal = this.state.visibleMprCoronal
    const visibleMprSagittal = this.state.visibleMprSagittal
    const visibleMprAxial = this.state.visibleMprAxial

    let iconToolColor = this.state.toolState === 1 ? '#FFFFFF' : '#999999'

    const dcmViewer = this.getActiveDcmViewer()

    const sliceMax = this.state.sliceMax

    //console.log('this.dicomViewersRefs: ', this.dicomViewersRefs)
    //console.log('isMultipleFiles: ', isMultipleFiles)    
    //console.log('this.mprPlane: ', this.mprPlane) 

    return (
      <div>
        <AppBar className={classes.appBar} position='static' elevation={0}>
          <Toolbar variant="dense">
            <IconButton edge="start" className={classes.menuButton} color="inherit" aria-label="menu" onClick={this.toggleMainMenu}>
              <MenuIcon />
            </IconButton>
            { this.appBarTitle(classes, isOpen, dcmViewer) }
            
            <div className={classes.grow} />
            { !isOpen && !isDicomdir ? (
              <IconButton onClick={this.showAbout}>
                <Icon path={mdiInformationOutline} size={iconSize} color={iconColor} />
              </IconButton> 
             ) : null
            }            
            { iconTool !== null && this.props.tool !== null &&  isOpen ? (
                <IconButton onClick={this.toolChange}>
                  <Icon path={iconTool} size={iconSize} color={iconToolColor} />
                </IconButton>
              ) : null
            }
            { isOpen && dcmViewer.numberOfFrames > 1 &&  isOpen ? (
                <IconButton onClick={this.cinePlayer}>
                  <Icon path={mdiVideo} size={iconSize} color={iconColor} />
                </IconButton> 
              ): null
            }
            { isOpen ? (
              <IconButton onClick={this.resetImage}>
                <Icon path={mdiRefresh} size={iconSize} color={iconColor} />
              </IconButton>
             ) : null
            }
            { isOpen ? (
              <IconButton color="inherit" onClick={this.saveShot}>
                <Icon path={mdiCamera} size={iconSize} color={iconColor} />
              </IconButton>
             ) : null
            }
            { isOpen ? (
              <IconButton color="inherit" onClick={this.toggleToolbox}>
                <Icon path={mdiToolbox} size={iconSize} color={iconColor} />
              </IconButton>
              ) : null
            }              
            { isOpen ? (
              <IconButton color="inherit" onClick={this.toggleMeasure}>
                <Icon path={mdiFileCad} size={iconSize} color={iconColor} />
              </IconButton>
              ) : null
            }  
            { isOpen && dcmViewer.isDicom ? (
              <IconButton color="inherit" onClick={this.toggleHeader}>
                <Icon path={mdiFileDocument} size={iconSize} color={iconColor} />
              </IconButton>
              ) : null
            }  
            { isDicomdir ? (
              <IconButton color="inherit" onClick={this.toggleDicomdir}>
                <Icon path={mdiFolderOpen} size={iconSize} color={iconColor} />
              </IconButton>
              ) : null
            }    
            { isOpen ? (
              <IconButton color="inherit" onClick={this.toggleFileManager}>
                <Icon path={mdiFileCabinet} size={iconSize} color={iconColor} />
              </IconButton>
              ) : null
            }                        
          </Toolbar>
        </AppBar>

        <Drawer 
          variant="persistent"
          open={visibleMainMenu} 
          style={{position:'relative', zIndex: 1}}
          onClose={this.toggleMainMenu}
        >
          <div className={classes.toolbar}>
            <List dense={true}>
              <ListItem button onClick={() => this.showAppBar()}>
                <ListItemIcon><MenuIcon /></ListItemIcon>
                <ListItemText primary='Tool Bar' />
              </ListItem>    
              <ListItem button onClick={() => this.toggleFileManager()}>
                <ListItemIcon><Icon path={mdiFileCabinet} size={iconSize} color={iconColor} /></ListItemIcon>
                <ListItemText classes={primaryClass} primary='File Manager' />
              </ListItem>      
              
              <ListItem button onClick={() => this.toggleOpenMenu()}>
                <ListItemIcon><Icon path={mdiFolderMultiple} size={iconSize} color={iconColor} /></ListItemIcon>
                <ListItemText classes={primaryClass} primary='Open ...' />
                {openMenu ? <ExpandLess /> : <ExpandMore />}
              </ListItem>                    
              <Collapse in={openMenu} timeout="auto" unmountOnExit>
                <List dense={true} component="div">
                  <ListItem button style={{paddingLeft: 30}} onClick={() => this.showFileOpen()}>
                    <ListItemIcon><Icon path={mdiFolder} size={'1.0rem'} color={iconColor} /></ListItemIcon>
                    <ListItemText classes={primaryClass} 
                      primary={
                        <Typography type="body1" style={{fontSize: '0.80em', marginLeft: '-20px'}}>File</Typography>
                      } />
                  </ListItem>
                  <ListItem button style={{paddingLeft: 30}} onClick={() => this.showOpenUrl()}>
                    <ListItemIcon><Icon path={mdiWeb} size={'1.0rem'} color={iconColor} /></ListItemIcon>
                    <ListItemText classes={primaryClass} 
                      primary={
                        <Typography type="body1" style={{fontSize: '0.80em', marginLeft: '-20px'}}>URL</Typography>
                      } />
                  </ListItem>
                  { isInputDirSupported() && !isMobile?
                  <ListItem button style={{paddingLeft: 30}} onClick={() => this.showOpenFolder()}>
                    <ListItemIcon><Icon path={mdiFolderOpen} size={'1.0rem'} color={iconColor} /></ListItemIcon>
                    <ListItemText classes={primaryClass} 
                      primary={
                        <Typography type="body1" style={{fontSize: '0.80em', marginLeft: '-20px'}}>Folder</Typography>
                      } />
                  </ListItem>    
                  : null }                     
                  { isInputDirSupported() && !isMobile?
                  <ListItem button style={{paddingLeft: 30}} onClick={() => this.showOpenDicomdir()}>
                    <ListItemIcon><Icon path={mdiFolderOpen} size={'1.0rem'} color={iconColor} /></ListItemIcon>
                    <ListItemText classes={primaryClass} 
                      primary={
                        <Typography type="body1" style={{fontSize: '0.80em', marginLeft: '-20px'}}>DICOMDIR</Typography>
                      } />
                  </ListItem>    
                  : null }                                          
                </List>
              </Collapse>  

              <ListItem button onClick={() => this.clear()}>
                <ListItemIcon><Icon path={mdiDelete} size={iconSize} color={iconColor} /></ListItemIcon>
                <ListItemText classes={primaryClass} primary='Clear All' />
              </ListItem>  
              <ListItem button onClick={this.handleLayout}>
                <ListItemIcon><Icon path={mdiViewGridPlusOutline} size={iconSize} color={iconColor} /></ListItemIcon>
                <ListItemText classes={primaryClass} primary='Layout' />              
              </ListItem>   
              <ListItem button onClick={() => this.showSettings()}>
                <ListItemIcon><Icon path={mdiSettings} size={iconSize} color={iconColor} /></ListItemIcon>
                <ListItemText classes={primaryClass} primary='Settings' />
              </ListItem>                
              <Divider />
              <ListItem button onClick={() => this.toggleToolbox()} disabled={!isOpen}>
                <ListItemIcon><Icon path={mdiChartHistogram} size={iconSize} color={iconColor} /></ListItemIcon>
                <ListItemText classes={primaryClass} primary='Histogram' />
              </ListItem>  
              <ListItem button onClick={() => this.toggleMpr()} disabled={!isOpen || !isMultipleFiles || this.mprPlane === ''}>
                <ListItemIcon><Icon path={mdiAxisArrow} size={iconSize} color={iconColor} /></ListItemIcon>
                <ListItemText classes={primaryClass} primary='MPR' />
                {openMpr ? <ExpandLess /> : <ExpandMore />}
              </ListItem>              
              <Collapse in={openMpr} timeout="auto" unmountOnExit>
                <List dense={true} component="div">
                  <ListItem button style={{paddingLeft: 40}} onClick={() => this.mprOrthogonal()}>
                    {visibleMprOrthogonal ? <ListItemIcon style={{marginLeft: '-10px'}}><Icon path={mdiCheck} size={'1.0rem'} color={iconColor} /></ListItemIcon> : null}
                    <ListItemText 
                      style={visibleMprOrthogonal ? {marginLeft: '-7px'} : {marginLeft: '40px'}} 
                      classes={primaryClass} 
                      primary={
                        <Typography type="body1" style={{fontSize: '0.80em', marginLeft: '-23px'}}>Orthogonal</Typography>
                      } />
                  </ListItem>
                  <ListItem button style={{paddingLeft: 40}} onClick={() => this.mprCoronal()}>
                    {visibleMprCoronal ? <ListItemIcon style={{marginLeft: '-10px'}}><Icon path={mdiCheck} size={'1.0rem'} color={iconColor} /></ListItemIcon> : null}
                    <ListItemText 
                      style={visibleMprCoronal ? {marginLeft: '-7px'} : {marginLeft: '40px'}}
                      classes={primaryClass} 
                      primary={
                        <Typography type="body1" style={{fontSize: '0.80em', marginLeft: '-23px'}}>Coronal</Typography>
                      } />
                  </ListItem>    
                  <ListItem button style={{paddingLeft: 40}} onClick={() => this.mprSagittal()}>
                    {visibleMprSagittal ? <ListItemIcon style={{marginLeft: '-10px'}}><Icon path={mdiCheck} size={'1.0rem'} color={iconColor} /></ListItemIcon> : null}  
                    <ListItemText 
                      style={visibleMprSagittal ? {marginLeft: '-7px'} : {marginLeft: '40px'}} 
                      classes={primaryClass} 
                      primary={
                        <Typography type="body1" style={{fontSize: '0.80em', marginLeft: '-23px'}}>Sagittal</Typography>
                      } />
                  </ListItem>    
                  <ListItem button style={{paddingLeft: 40}} onClick={() => this.mprAxial()}>
                    {visibleMprAxial ? <ListItemIcon style={{marginLeft: '-10px'}}><Icon path={mdiCheck} size={'1.0rem'} color={iconColor} /></ListItemIcon> : null}  
                    <ListItemText 
                      style={visibleMprAxial ? {marginLeft: '-7px'} : {marginLeft: '40px'}} 
                      classes={primaryClass} 
                      primary={
                        <Typography type="body1" style={{fontSize: '0.80em', marginLeft: '-23px'}}>Axial</Typography>
                      } />
                  </ListItem>                                               
                </List>
              </Collapse>  
              <ListItem button onClick={() => this.toggleImageEdit()} disabled={!isOpen}>
                <ListItemIcon><Icon path={mdiImageEdit} size={iconSize} color={iconColor} /></ListItemIcon>
                <ListItemText classes={primaryClass} primary='Edit' />
                {openImageEdit ? <ExpandLess /> : <ExpandMore />}
              </ListItem>          
              <Collapse in={openImageEdit} timeout="auto" unmountOnExit>
                <List  dense={true} component="div">
                  <ListItem button style={{paddingLeft: 30}} onClick={() => this.toolExecute('Invert')}>
                    <ListItemIcon><Icon path={mdiInvertColors} size={iconSize} color={iconColor} /></ListItemIcon>
                    <ListItemText classes={primaryClass} primary="Invert" />
                  </ListItem>
                </List>
              </Collapse>   
              <ListItem button onClick={() => this.toggleTools()} disabled={!isOpen}>
                <ListItemIcon><Icon path={mdiTools} size={iconSize} color={iconColor} /></ListItemIcon>
                <ListItemText classes={primaryClass} primary='Tools' />
                {openTools ? <ExpandLess /> : <ExpandMore />}
              </ListItem>   
              <Collapse in={openTools} timeout="auto" unmountOnExit>
                <List dense={true} component="div">
                  <ListItem button style={{paddingLeft: 30}} onClick={() => this.toolExecute('notool')} disabled={!isOpen}>
                    <ListItemIcon><Icon path={mdiCursorDefault} size={iconSize} color={iconColor} /></ListItemIcon>
                    <ListItemText classes={primaryClass} primary='No tool' />
                  </ListItem>         
                  <ListItem button style={{paddingLeft: 30}} onClick={() => this.toolExecute('Wwwc')} disabled={!isOpen}>
                    <ListItemIcon><Icon path={mdiArrowAll} size={iconSize} color={iconColor} /></ListItemIcon>
                    <ListItemText classes={primaryClass} primary='WW/WC' />
                  </ListItem>  
                  <ListItem button style={{paddingLeft: 30}} onClick={() => this.toolExecute('Pan')} disabled={!isOpen}>
                    <ListItemIcon><Icon path={mdiCursorPointer} size={iconSize} color={iconColor} /></ListItemIcon>
                    <ListItemText classes={primaryClass} primary='Pan' />
                  </ListItem>  
                  <ListItem button style={{paddingLeft: 30}} onClick={() => this.toolExecute('Zoom')} disabled={!isOpen}>
                    <ListItemIcon><Icon path={mdiMagnify} size={iconSize} color={iconColor} /></ListItemIcon>
                    <ListItemText classes={primaryClass} primary='Zoom' />
                  </ListItem>      
                  <ListItem button style={{paddingLeft: 30}} onClick={() => this.toolExecute('Magnify')} disabled={!isOpen}>
                    <ListItemIcon><Icon path={mdiCheckboxIntermediate} size={iconSize} color={iconColor} /></ListItemIcon>
                    <ListItemText classes={primaryClass} primary='Magnify' />
                  </ListItem>       
                  <ListItem button style={{paddingLeft: 30}} onClick={() => this.toolExecute('Length')} disabled={!isOpen}>
                    <ListItemIcon><Icon path={mdiRuler} size={iconSize} color={iconColor} /></ListItemIcon>
                    <ListItemText classes={primaryClass} primary='Length' />
                  </ListItem>        
                  <ListItem button style={{paddingLeft: 30}} onClick={() => this.toolExecute('Probe')} disabled={!isOpen}>
                    <ListItemIcon><Icon path={mdiEyedropper} size={iconSize} color={iconColor} /></ListItemIcon>
                    <ListItemText classes={primaryClass} primary='Probe' />
                  </ListItem> 
                  <ListItem button style={{paddingLeft: 30}} onClick={() => this.toolExecute('Angle')} disabled={!isOpen}>
                    <ListItemIcon><Icon path={mdiAngleAcute} size={iconSize} color={iconColor} /></ListItemIcon>
                    <ListItemText classes={primaryClass} primary='Angle' />
                  </ListItem>  
                  <ListItem button style={{paddingLeft: 30}} onClick={() => this.toolExecute('EllipticalRoi')} disabled={!isOpen}>
                    <ListItemIcon><Icon path={mdiEllipse} size={iconSize} color={iconColor} /></ListItemIcon>
                    <ListItemText classes={primaryClass} primary='Elliptical Roi' />
                  </ListItem>     
                  <ListItem button style={{paddingLeft: 30}} onClick={() => this.toolExecute('RectangleRoi')} disabled={!isOpen}>
                    <ListItemIcon><Icon path={mdiRectangle} size={iconSize} color={iconColor} /></ListItemIcon>
                    <ListItemText classes={primaryClass} primary='Rectangle Roi' />
                  </ListItem> 
                  <ListItem button style={{paddingLeft: 30}} onClick={() => this.toolExecute('FreehandRoi')} disabled={!isOpen}>
                    <ListItemIcon><Icon path={mdiGesture} size={iconSize} color={iconColor} /></ListItemIcon>
                    <ListItemText classes={primaryClass} primary='Freehand Roi' />
                  </ListItem> 
                </List>
              </Collapse> 

            </List>
            
            { isMultipleFiles ?
              <div>     
                <Divider />     
                <div align='center'>
                  <IconButton onClick={this.listOpenFilesFirstFrame} size='small'>
                    <Icon path={mdiSkipBackward} size={'1.0rem'} color={iconColor} />
                  </IconButton>
                  <IconButton onClick={this.listOpenFilesPreviousFrame} size='small'>
                      <Icon path={mdiSkipPrevious} size={'1.0rem'} color={iconColor} />
                  </IconButton>
                  <IconButton onClick={this.listOpenFilesScrolling} size='small'>
                    <Icon path={this.state.listOpenFilesScrolling ? mdiPause : mdiPlay} size={'1.0rem'} color={iconColor} />
                  </IconButton>
                  <IconButton onClick={this.listOpenFilesNextFrame} size='small'>
                      <Icon path={mdiSkipNext} size={'1.0rem'} color={iconColor} />
                  </IconButton>
                  <IconButton onClick={this.listOpenFilesLastFrame} size='small'>
                      <Icon path={mdiSkipForward} size={'1.0rem'} color={iconColor} />
                  </IconButton>                
                </div>  
                <div style={{textAlign: 'center'}}>
                  <Typography type="body1" style={{fontSize: '0.80em'}}>{`${this.state.sliceIndex+1} / ${sliceMax}`}</Typography>
                </div>  
                <div style={{width: '130px', margin: 'auto'}}>
                  <Slider
                    style={{marginTop: '-4px'}}
                    value={this.state.sliceIndex}
                    onChange={this.handleSliceChange}
                    color="secondary"
                    min={0}
                    max={sliceMax-1}
                    step={100/sliceMax}
                  />
                </div>
              </div> : null
            }

          </div>
        </Drawer>       

        <Drawer
          variant="persistent"
          anchor='right'
          open={visibleHeader}
          onClose={this.toggleHeader}
        >
          { visibleHeader ? <DicomHeader dcmViewer={dcmViewer} classes={classes} color={iconColor} /> : null } 
        </Drawer>

        <Drawer
          variant="persistent"
          anchor='right'
          open={visibleMeasure}
          onClose={this.toggleMeasure}
        >
          <div style={{marginTop: '48px'}}>
            <Toolbar variant="dense">
              <Typography variant="subtitle1" className={classes.title}>
                Measurements&nbsp;&nbsp;
              </Typography>
              <div className={classes.grow} />
              <IconButton color="inherit" onClick={this.saveMeasure} edge="end">
                <Icon path={mdiContentSaveOutline} size={iconSize} color={iconColor} />
              </IconButton>
              <IconButton color="inherit" onClick={this.clearMeasure} edge="end">
                <Icon path={mdiTrashCanOutline} size={iconSize} color={iconColor} />
              </IconButton>
            </Toolbar>
            <div>  
              { isOpen ? <Measurements dcmViewer={dcmViewer} toolRemove={this.toolRemove} classes={classes} /> : null } 
            </div>
          </div>
        </Drawer>  

        <Drawer
          variant="persistent"
          anchor='right'
          open={visibleToolbox}
          onClose={this.toggleToolbox}
        >
          <div style={{marginTop: '48px'}}>
            <div>  
              { isOpen ? <Histogram key={this.getFileName(dcmViewer)} /> : null } 
            </div>
          </div>
        </Drawer>          

        <Drawer
          variant="persistent"
          anchor={getSettingsDicomdirView()}
          open={visibleDicomdir}
          onClose={this.toggleDicomdir}
        >
          <div>
            <div>  
              {visibleDicomdir ? <Dicomdir onOpenFile={this.handleOpenFileDicomdir} onOpenFs={this.handleOpenSandboxFs} /> : null} 
            </div>
          </div>
        </Drawer>   

        <Drawer
          variant="persistent"
          anchor={getSettingsFsView()}
          open={visibleFileManager}
          onClose={this.toggleFileManager}
        >
          <div>
            <div>
              {visibleFileManager ? 
                <FsUI 
                  onOpen={this.handleOpenSandboxFs} 
                  onOpenImage={this.handleOpenImage} 
                  onOpenMultipleFilesCompleted={this.openMultipleFilesCompleted}
                  onOpenDicomdir={this.handleOpenFsDicomdir} 
                  color={iconColor} 
                /> 
              : null}
            </div>
          </div>
        </Drawer>   

        {visibleSettings ? <Settings onClose={this.hideSettings}/> : null}

        {visibleAbout ? <AboutDlg onClose={this.showAbout}/> : null}

        {visibleDownloadZipDlg ? <DownloadZipDlg onClose={this.hideDownloadZipDlg} url={this.url} /> : null}

        {visibleOpenMultipleFilesDlg ? <OpenMultipleFilesDlg onClose={this.hideOpenMultipleFilesDlg} files={this.files} origin={'local'} /> : null}

        <Dialog
            open={visibleClearMeasureDlg}
            onClose={this.hideClearMeasureDlg}
        >
            <DialogTitle>{"Are you sure to remove all the measurements?"}</DialogTitle>
            <DialogActions>
                <Button onClick={this.hideClearMeasureDlg}>
                    Cancel
                </Button>
                <Button onClick={this.confirmClearMeasureDlg} autoFocus>
                    Ok
                </Button>
            </DialogActions>
        </Dialog>

        <Dialog
            open={visibleZippedFileDlg}
            onClose={this.hideZippedFileDlg}
        >
            <DialogTitle>{"This is a zipped file, would you import into sandbox file system?"}</DialogTitle>
            <DialogActions>
                <Button onClick={this.hideZippedFileDlg}>
                    Cancel
                </Button>
                <Button onClick={this.confirmZippedFileDlg} autoFocus>
                    Ok
                </Button>
            </DialogActions>
        </Dialog>

        <Dialog
            open={this.state.visibleOpenUrl}
            aria-labelledby="form-dialog-title"
        >
            <DialogTitle id="form-dialog-title">{"Open URL"}</DialogTitle>
              <DialogContent>
                <DialogContentText id="alert-dialog-description">
                  Insert an URL to download a DICOM or image file:
                </DialogContentText>
                <TextField
                    autoFocus
                    margin="dense"
                    id="id-open-url"
                    inputRef={input => (this.openUrlField = input)}
                    fullWidth
                />
              </DialogContent>
            <DialogActions>
                <Button onClick={() => this.hideOpenUrl(false)} >
                    Cancel
                </Button>
                <Button onClick={() => this.hideOpenUrl(true)} autoFocus>
                    Ok
                </Button>
            </DialogActions>
        </Dialog>

        <Popover
          id={'id-layout'}
          open={visibleLayout}
          anchorEl={this.state.anchorElLayout}
          onClose={this.closeLayout}
          anchorOrigin={{
            vertical: 'center',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'center',
            horizontal: 'left',
          }}
        >
          <LayoutTool 
            row={this.props.layout[0]-1} 
            col={this.props.layout[1]-1}
            onChange={this.changeLayout}
          />  
        </Popover>        

        <Snackbar
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
          open={visibleVolumeBuilding}
          autoHideDuration={6000}
          message="Volume building, wait please ..."
        />

        <div style={{height: 'calc(100vh - 48px)'}}>
          {this.buildLayoutGrid()}  
        </div>

        <div>
          <input
            type="file"
            id="file_open"
            style={{ display: "none" }}
            ref={this.fileOpen}
            onChange={e => this.handleOpenLocalFs(e.target.files)}
            multiple
          />
        </div>

        <div>
          <input
            type="file"
            id="file_dicomdir"
            style={{ display: "none" }}
            ref={this.openDicomdir}
            onChange={e => this.handleOpenDicomdir(e.target.files)}
            webkitdirectory="" mozdirectory="" directory="" multiple
          />
        </div>

        <div>
          <input
            type="file"
            id="file_folder"
            style={{ display: "none" }}
            ref={this.openFolder}
            onChange={e => this.handleOpenFolder(e.target.files)}
            webkitdirectory="" mozdirectory="" directory="" multiple
          />
        </div>    

      </div>
    )
  }
}

const mapStateToProps = (state) => {
  return {
    localFileStore: state.localFileStore,
    files: state.files,
    isOpen: state.isOpen,
    tool: state.tool,
    activeDcmIndex: state.activeDcmIndex,
    measurements: state.measurements,
    layout: state.layout,
    dicomdir: state.dicomdir,
    fsZippedFile: state.fsZippedFile,
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    clearingStore: () => dispatch(clearStore()),
    setLocalFileStore: (file) => dispatch(localFileStore(file)),
    toolStore: (tool) => dispatch(dcmTool(tool)),
    isOpenStore: (value) => dispatch(dcmIsOpen(value)),
    setActiveDcm: (dcm) => dispatch(activeDcm(dcm)),
    setActiveDcmIndex: (index) => dispatch(activeDcmIndex(index)),
    setActiveMeasurements: (measurements) => dispatch(activeMeasurements(measurements)),
    setLayoutStore: (row, col) => dispatch(setLayout(row, col)),
    setDicomdirStore: (dicomdir) => dispatch(setDicomdir(dicomdir)),
    setFsZippedFile: (file) => dispatch(setZippedFile(file)),
    setVolumeStore: (file) => dispatch(setVolume(file)),
    setFilesStore: (files) => dispatch(filesStore(files)),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(App))
