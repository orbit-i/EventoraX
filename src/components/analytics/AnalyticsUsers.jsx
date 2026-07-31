import './AnalyticsUsers.css'
import UsersData from './AnalyticsUsersData'
import EventsData from './AnalyticsEventsData'

function AnalyticsUsers() {
    return (
        <div className='analytics-users-events-container'>
            <div className='analytics-users-container'>
                <div className='analytics-users-table-container-upper-section'>
                    <p>Top 10 Users</p>
                    <div className='table-scroll'>
                        <table className='analytics-users-table'>
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Email</th>
                                    <th>Events</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {
                                    UsersData.map((data) => (
                                        <tr key={data.id}>
                                            <td className='user-name-img-data-container'>
                                                <img src={data.img} alt="img1" />
                                                <p>{data.name}</p>
                                            </td>
                                            <td>
                                                {data.email}
                                            </td>
                                            <td>
                                                {data.events}
                                            </td>
                                            <td>
                                                {data.status}
                                            </td>
                                        </tr>
                                    ))
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div className='analytics-events-container'>
                <div className='analytics-users-table-container-upper-section'>
                    <p>Top 10 Events</p>
                    <div className='table-scroll'>
                        <table className='analytics-events-table'>
                            <thead>
                                <tr>
                                    <th>Event Name</th>
                                    <th>Organizer</th>
                                    <th>Reg</th>
                                    <th>Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {
                                    EventsData.map((data) => (
                                        <tr key={data.id}>
                                            <td className='user-name-img-data-container'>
                                                <img src={data.img} alt="img1" />
                                                <p>{data.name}</p>
                                            </td>
                                            <td>
                                                {data.organizer}
                                            </td>
                                            <td>
                                                {data.registration}
                                            </td>
                                            <td>
                                                {data.revenue}
                                            </td>
                                        </tr>
                                    ))
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AnalyticsUsers
