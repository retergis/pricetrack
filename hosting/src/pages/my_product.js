
import React, { PureComponent } from "react"
import axios from "axios"
import { loadProgressBar } from 'axios-progress-bar'
import 'axios-progress-bar/dist/nprogress.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSortUp, faSortDown } from '@fortawesome/free-solid-svg-icons'

import Layout from "../components/layout"
import ProductList from '../components/Block/ProductList'
import Loading from '../components/Block/Loading'
import { withAuthentication, AuthUserContext } from '../components/Session'

loadProgressBar()

const DEFAULT_NUMBER_ITEMS = 15
const HEAD_LINE_PRICE_TRACKER = 'Theo dõi giá'

class MyProductComponent extends PureComponent {
    constructor(props) {
        super(props)

        this.state = {
            urls: [],
            loading: false,
            error: false,
            
            orderBy: 'created_at',
            desc: 'true',
            add_by: '',
            following: false,
            currentMode: 'my_product',
            limit: DEFAULT_NUMBER_ITEMS,
            next: false,
            latest_params: {}
        }
    }

    SORT_TEXT = {
        'my_product': 'Tất cả',
        'my_product_following': 'Đang theo dõi',
    }
    orderByModes = () => Object.keys(this.SORT_TEXT)

    setOtherBy(mode) {
        let currentMode = mode 
        let { orderBy, desc, add_by } = this.state
        let following = currentMode === 'my_product_following' ? true : false

        if (mode === this.state.currentMode) {
            desc = desc === 'true' ? 'false' : 'true'
        }
        add_by = this.props.authUser.email

        this.setState({ currentMode, orderBy, desc, add_by, following }, () => this._loadData())
    }

    async componentDidMount() {
        const authUser = this.props.authUser || {}
        const add_by = authUser.email || ''
        this.setState({ add_by }, () => this._loadData())
    }

    async _fetchData(params) {
        console.log('context authUser',this.props.authUser)

        let response = await axios.get('/api/listUrls', { params })
        let { data, headers } = response
        let nextStartAt = headers.nextstartat || null
        params['startAt'] = nextStartAt

        return { urls: data, next: nextStartAt, params }
    }

    async _loadData() {
        this.setState({ loading: true })

        let params = {
            orderBy: this.state.orderBy,
            desc: this.state.desc,
            limit: this.state.limit,
            add_by: this.state.add_by,
            following: this.state.following
        }

        try {
            let { urls, next } = await this._fetchData(params)
            this.setState({ urls, next, loading: false, latest_params: params })
        } catch(err) {
            console.error(err)
            this.setState({ loading: false, error: true })
        }
    }

    async onClickLoadMore(params) {
        try {
            let { urls, next } = await this._fetchData(params)
            let new_urls = [...this.state.urls, ...urls]
            this.setState({ urls: new_urls, next })
        } catch(err) {
            console.error(err)
            this.setState({ loading: false, error: true })
        }
    }

    renderListUrl() {
        if (this.state.loading) return <Loading />
        if (this.state.error) return 'Some thing went wrong'

        return <ProductList urls={this.state.urls}
                            loadMore={this.state.next} 
                            onClickLoadMore={
                                () => this.onClickLoadMore(this.state.latest_params)
                            } />
    }

    sortControl() {
        let controls = []
        for (let mode of this.orderByModes()) {
            let selected = this.state.currentMode === mode
            let sortIcon = null
            if (selected) {
                sortIcon = <span className="ml-2">
                    <FontAwesomeIcon icon={this.state.desc === 'true' ? faSortDown : faSortUp} />
                </span>
            }
            controls.push(
                <span className="text-white ml-2 btn" 
                    key={mode}
                    onClick={() => this.setOtherBy(mode)}
                    style={{ fontWeight: selected ? 700 : 300 }}>
                    {this.SORT_TEXT[mode]}
                    {sortIcon}
                </span>
            )
        }

        return controls
    }

    render() {
        return (
            <Layout>
                <div className="d-flex align-items-center p-3 my-3 text-white-50 rounded shadow-sm" style={{background: '#03A9F4'}}>
                    <div className="d-flex flex-grow-1 align-items-center">
                        <img className="mr-3" src="http://getbootstrap.com/docs/4.2/assets/brand/bootstrap-outline.svg" alt="" width="48" height="48" />
                        <div className="lh-100">
                          <h6 className="mb-0 text-white lh-100">{HEAD_LINE_PRICE_TRACKER}</h6>
                          <small>beta</small>
                        </div>
                    </div>

                    <div className="lh-100 mr-0 p-2 bd-highlight text-white">
                        {this.sortControl()}
                   </div>
                </div>

                <div className="my-3 p-3 bg-white rounded shadow-sm" id="listUrls">
                    {this.renderListUrl()}
                </div>
            </Layout>
        )
    }
}

const MyProductComponentWithContext = () => {
    return <AuthUserContext.Consumer>
        {authUser => authUser ? <MyProductComponent authUser={authUser} /> : 'Loading ...'}
    </AuthUserContext.Consumer>
}

export default withAuthentication(MyProductComponentWithContext)