var React = require('react')
var Markdown = require('markdown.jsx')
var UserID = require('userID.jsx')
var PostList = require('postlist.jsx')
var GetIPFS = require('getipfs.jsx')
var Link = require('react-router').Link
var Icon = require('icon.jsx')
var {Loading} = require('status-components.jsx')

module.exports = function (boardsAPI) {
  return React.createClass({
    getInitialState () {
      return { loading: true, whitelist: [] }
    },
    componentDidMount () {
      boardsAPI.use(boards => {
        if (!this.isMounted()) return
        var ee = boards.getEventEmitter()
        ee.on('init', (err, limited) => {
          if ((!err || limited) && this.isMounted()) {
            this.init(boards)
          }
        })
        if (this.props.params.userid) {
          ee.on('whitelist for ' + this.props.params.boardname + '@' + this.props.params.userid, (whitelist) => {
            if (this.isMounted()) {
              this.setState({ whitelist })
            } else return true
          })
          ee.on('settings for ' + this.props.params.boardname + '@' + this.props.params.userid, (res) => {
            if (!this.isMounted()) return true
            if (res) this.setState({ loading: false, name: res.fullname, description: res.description })
          })
        } else {
          this.setState({ loading: false, description: 'All the messages posted in __#' + this.props.params.boardname + '__' })
        }
        if (boards.isInit || this.state.api) {
          this.init(boards)
        }
      })
    },
    componentWillReceiveProps (props) {
      boardsAPI.use(b => this.init(b, props))
    },
    init (boards, newProps) {
      var props = newProps || this.props
      if (!props.params.userid) return
      boards.getBoardSettings(props.params.userid, props.params.boardname)
      this.setState({ loading: true, init: true, api: boards, userid: boards.getMyID(), limited: boards.limited })
    },
    toolbox () {
      if (this.state.limited) {
        return <div className='text-center'>Toolbox not available in limited mode<hr/></div>
      } else {
        return <div className='iconbar text-center'>
          <Link to={'/edit/board/' + this.props.params.boardname} ><Icon name='edit' className='fa-2x light' /></Link>
          <Link to={'/edit/board/' + this.props.params.boardname + '/post'} ><Icon name='plus' className='fa-2x light' /></Link>
        </div>
      }
    },
    render () {
      if (this.state.api) {
        if (this.state.loading) {
          return <Loading title='Downloading Board data'>
            { this.props.params.userid === 'me' || this.props.params.userid === this.state.userid
              ? <Link to={'/edit/board/' + this.props.params.boardname} className='button button-primary'>Edit Board</Link>
              : <span></span> }
          </Loading>
        } else {
          return (<div className='board'>
            <h2>{this.state.name}</h2>
            <Markdown source={this.state.description} skipHtml={true} />
            {this.props.params.userid ? <h5><UserID id={this.props.params.userid} api={this.state.api} /></h5> : <p></p>}
            <div className='whitelist'>
              {this.state.whitelist.map(i => <UserID id={i} key={i} api={this.state.api} />)}
            </div>
            <hr />
            {this.toolbox()}
            <PostList board={this.props.params.boardname} admin={this.props.params.userid} api={this.state.api} />
          </div>)
        }
      } else return <GetIPFS api={this.state.api} />
    }
  })
}
