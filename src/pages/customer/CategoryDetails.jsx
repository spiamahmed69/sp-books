import { useParams } from 'react-router-dom'
import Books from './Books'
import { getCategory } from '../../lib/firestore'
export default function CategoryDetails() {
  const { slug } = useParams()
  const cat = getCategory(slug)
  return <Books mode="category" key={slug} />
}
